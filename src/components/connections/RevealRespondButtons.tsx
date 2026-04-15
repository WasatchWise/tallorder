'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export default function RevealRespondButtons({ revealId }: { revealId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [earned, setEarned] = useState(false)

  async function respond(action: 'approve' | 'decline') {
    setLoading(true)
    const res = await fetch('/api/reveals/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ revealId, action }),
    })
    const data = await res.json()
    if (res.ok) {
      setDone(true)
      // If approved and status indicates earn (we don't get that signal directly,
      // just refresh so balance updates)
      router.refresh()
    }
    setLoading(false)
  }

  if (done) {
    return (
      <p className="text-xs text-[#A8A29E]">Response sent.</p>
    )
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => respond('decline')}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-1.5 border border-[#D6D3D1] text-[#78716C] font-semibold py-2.5 rounded-lg text-sm hover:bg-[#F5F5F4] transition-colors disabled:opacity-50 cursor-pointer"
      >
        <X className="w-3.5 h-3.5" /> Decline
      </button>
      <button
        onClick={() => respond('approve')}
        disabled={loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Check className="w-3.5 h-3.5" /> Approve
      </button>
    </div>
  )
}
