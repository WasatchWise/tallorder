'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageCircle, UserPlus, Clock, Check } from 'lucide-react'
import Link from 'next/link'


interface Connection {
  id: string
  status: string
  requester_id: string
}

interface Props {
  viewerId: string
  viewerTier: string
  targetId: string
  targetPseudonym: string
  connection: Connection | null
}

export default function ConnectButton({ viewerId, viewerTier, targetId, targetPseudonym, connection }: Props) {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [intro, setIntro] = useState('')
  const [showIntro, setShowIntro] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isPaid = viewerTier === 'paid' || viewerTier === 'founding'

  async function sendRequest() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/connections/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetId, introMessage: intro }),
      })
      if (res.ok) {
        setSent(true)
      } else {
        const data = await res.json().catch(() => ({}))
        if (data.error === 'already_exists') {
          setSent(true)
        } else {
          setError('Something went wrong. Please try again.')
        }
      }
    } catch {
      setError('Something went wrong. Please try again.')
    }
    setLoading(false)
  }

  // Already connected — show message button
  if (connection?.status === 'accepted') {
    return (
      <Link
        href={`/messages/${connection.id}`}
        className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm"
      >
        <MessageCircle className="w-4 h-4" /> Message {targetPseudonym}
      </Link>
    )
  }

  // Pending — sent by viewer
  if (connection?.status === 'pending' && connection.requester_id === viewerId) {
    return (
      <div className="w-full flex items-center justify-center gap-2 border border-[#E7E5E4] bg-white text-[#78716C] font-medium py-3 rounded-xl text-sm">
        <Clock className="w-4 h-4" /> Request sent
      </div>
    )
  }

  // Pending — received from target, viewer can accept
  if (connection?.status === 'pending' && connection.requester_id === targetId) {
    return (
      <div className="flex gap-3">
        <button
          onClick={async () => {
            setLoading(true)
            await supabase.from('connections').update({ status: 'declined' }).eq('id', connection.id)
            router.refresh()
            setLoading(false)
          }}
          className="flex-1 border border-[#D6D3D1] text-[#78716C] font-semibold py-3 rounded-xl text-sm hover:bg-[#F5F5F4] transition-all duration-150 cursor-pointer"
        >
          Decline
        </button>
        <button
          onClick={async () => {
            setLoading(true)
            await fetch('/api/connections/accept', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ connectionId: connection.id }),
            })
            router.refresh()
            setLoading(false)
          }}
          disabled={loading}
          className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
        >
          <Check className="w-4 h-4 inline mr-1" /> Accept
        </button>
      </div>
    )
  }

  // Sent successfully this session
  if (sent) {
    return (
      <div className="w-full flex items-center justify-center gap-2 border border-[#E7E5E4] bg-[#FEF3C7] text-[#D97706] font-medium py-3 rounded-xl text-sm">
        <Check className="w-4 h-4" /> Request sent to {targetPseudonym}
      </div>
    )
  }

  // Free user — paywall
  if (!isPaid) {
    return (
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 text-center">
        <p className="text-sm font-semibold text-[#1C1917] mb-1">Upgrade to connect</p>
        <p className="text-xs text-[#78716C] mb-4">
          Sending connection requests requires a Tall Order subscription.
        </p>
        <Link
          href="/subscription"
          className="inline-flex items-center justify-center bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-all duration-150"
        >
          See plans - from $4.99/mo
        </Link>
      </div>
    )
  }

  // Intro step
  if (showIntro) {
    return (
      <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
        <p className="text-sm font-semibold text-[#1C1917] mb-1">Add a note <span className="text-[#78716C] font-normal">(optional)</span></p>
        <p className="text-xs text-[#78716C] mb-3">140 characters max. Give them a reason to say yes.</p>
        <textarea
          value={intro}
          onChange={e => setIntro(e.target.value.slice(0, 140))}
          rows={3}
          placeholder="Hey, I noticed you're also into hiking..."
          className="w-full border border-[#D6D3D1] rounded-lg px-3 py-2.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent resize-none mb-3"
        />
        <p className="text-xs text-[#78716C] text-right mb-3">{intro.length}/140</p>
        {error && <p className="text-xs text-red-400 text-center mb-3">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={() => setShowIntro(false)}
            className="flex-1 border border-[#D6D3D1] text-[#78716C] font-medium py-2.5 rounded-lg text-sm hover:bg-[#F5F5F4] transition-all duration-150 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={sendRequest}
            disabled={loading}
            className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2.5 rounded-lg text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
          >
            {loading ? 'Sending...' : 'Send request'}
          </button>
        </div>
      </div>
    )
  }

  // Default: connect CTA
  return (
    <button
      onClick={() => setShowIntro(true)}
      className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl transition-all duration-150 text-sm cursor-pointer active:scale-[0.98]"
    >
      <UserPlus className="w-4 h-4" /> Connect with {targetPseudonym}
    </button>
  )
}
