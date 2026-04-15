'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Flag, ShieldOff, Loader2, Share2 } from 'lucide-react'

interface Props {
  targetId: string
  targetPseudonym: string
}

export default function ProfileActions({ targetId, targetPseudonym }: Props) {
  const router = useRouter()
  const [blocking, setBlocking] = useState(false)
  const [open, setOpen] = useState(false)
  const [shared, setShared] = useState(false)

  async function handleBlock() {
    if (!confirm(`Block ${targetPseudonym}? They won't be able to see your profile or contact you.`)) return
    setBlocking(true)

    await fetch('/api/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_id: targetId }),
    })

    router.replace('/browse')
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="text-xs text-[#A8A29E] hover:text-[#78716C] px-3 py-1.5 rounded-lg transition-colors"
      >
        More
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-8 z-20 bg-white border border-[#E7E5E4] rounded-xl shadow-lg py-1 min-w-[200px]">
            <button
              onClick={async () => {
                setOpen(false)
                const url = `https://tallorder.date/signup`
                const text = `Check out ${targetPseudonym} on Tall Order - a dating app for tall people. Sign up to connect: ${url}`
                if (typeof navigator !== 'undefined' && navigator.share) {
                  try { await navigator.share({ title: `${targetPseudonym} on Tall Order`, text, url }); return } catch {}
                }
                try { await navigator.clipboard.writeText(text); setShared(true); setTimeout(() => setShared(false), 2000) } catch {
                  window.prompt('Copy this:', text)
                }
              }}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1C1917] hover:bg-stone-50 w-full"
            >
              <Share2 className="w-4 h-4 text-[#D97706]" />
              {shared ? 'Link copied!' : 'Recommend to a friend'}
            </button>
            <Link
              href={`/report?id=${encodeURIComponent(targetId)}&pseudonym=${encodeURIComponent(targetPseudonym)}`}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1C1917] hover:bg-stone-50 w-full"
              onClick={() => setOpen(false)}
            >
              <Flag className="w-4 h-4 text-red-500" />
              Report
            </Link>
            <button
              onClick={() => { setOpen(false); handleBlock() }}
              disabled={blocking}
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#1C1917] hover:bg-stone-50 w-full disabled:opacity-50"
            >
              {blocking ? (
                <Loader2 className="w-4 h-4 animate-spin text-[#78716C]" />
              ) : (
                <ShieldOff className="w-4 h-4 text-[#78716C]" />
              )}
              Block
            </button>
          </div>
        </>
      )}
    </div>
  )
}
