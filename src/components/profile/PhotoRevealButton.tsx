'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, Clock, Check, ShoppingBag } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  targetId: string
  revealStatus: 'none' | 'pending' | 'approved' | 'cooldown'
  availableTokens: number
}

export default function PhotoRevealButton({ targetId, revealStatus, availableTokens }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState(revealStatus)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokens, setTokens] = useState(availableTokens)

  // Listen for reveal status changes (e.g. other user approves)
  useEffect(() => {
    if (status !== 'pending') return

    const channel = supabase
      .channel(`reveal:${targetId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'photo_reveals' },
        (payload) => {
          const row = payload.new as { target_id?: string; status?: string }
          if (row.target_id === targetId) {
            if (row.status === 'approved') {
              setStatus('approved')
              router.refresh()
            } else if (row.status === 'declined') {
              setStatus('cooldown')
            }
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [status, targetId])

  async function requestReveal() {
    setLoading(true)
    setError(null)
    const res = await fetch('/api/reveals/request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetId }),
    })
    const data = await res.json()
    if (res.ok) {
      setStatus('pending')
      setTokens(t => t - 3)
    } else if (data.error === 'insufficient_tokens') {
      setError('not_enough')
    } else if (data.error === 'cooldown_active') {
      setStatus('cooldown')
    } else {
      setError('failed')
    }
    setLoading(false)
  }

  if (status === 'approved') {
    return (
      <div className="w-full flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#1C1917] mb-0.5">See their photos</p>
          <p className="text-xs text-[#A8A29E]">You have {tokens} cm available</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#16A34A] font-medium">
          <Check className="w-3.5 h-3.5" /> Photos revealed
        </div>
      </div>
    )
  }

  if (status === 'pending') {
    return (
      <div className="w-full flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#1C1917] mb-0.5">See their photos</p>
          <p className="text-xs text-[#A8A29E]">You have {tokens} cm available</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#78716C]">
          <Clock className="w-3.5 h-3.5" /> Reveal requested, awaiting response
        </div>
      </div>
    )
  }

  if (status === 'cooldown') {
    return (
      <div className="w-full flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-[#1C1917] mb-0.5">See their photos</p>
          <p className="text-xs text-[#A8A29E]">You have {tokens} cm available</p>
        </div>
        <div className="text-xs text-[#A8A29E]">
          Reveal unavailable for 30 days after a decline.
        </div>
      </div>
    )
  }

  if (error === 'not_enough') {
    return (
      <div className="w-full">
        <div className="text-center">
          <p className="text-xs text-[#78716C] mb-2">You need 3 cm to request a reveal. You have {tokens} cm.</p>
          <Link
            href="/subscription"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#D97706] hover:underline"
          >
            <ShoppingBag className="w-3.5 h-3.5" /> Get cm
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-[#1C1917] mb-0.5">See their photos</p>
        <p className="text-xs text-[#A8A29E]">You have {tokens} cm available</p>
      </div>
      <div>
        <button
          onClick={requestReveal}
          disabled={loading || tokens < 3}
          className="flex items-center gap-2 text-xs font-semibold text-[#78716C] hover:text-[#1C1917] transition-colors disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
        >
          <Eye className="w-3.5 h-3.5" />
          {loading ? 'Requesting...' : `Request photo reveal (3 cm)`}
        </button>
        {tokens < 3 && (
          <p className="text-xs text-[#A8A29E] mt-1">
            <Link href="/subscription" className="text-[#D97706] hover:underline">Get more</Link>
          </p>
        )}
        {error === 'failed' && (
          <p className="text-xs text-red-500 mt-1">Something went wrong. Try again.</p>
        )}
      </div>
    </div>
  )
}
