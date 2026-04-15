'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'

export default function AcceptDeclineButtons({ connectionId }: { connectionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState<'accept' | 'decline' | null>(null)

  async function handle(action: 'accepted' | 'declined') {
    setLoading(action === 'accepted' ? 'accept' : 'decline')
    const route = action === 'accepted' ? '/api/connections/accept' : '/api/connections/decline'
    await fetch(route, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    })
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      <button
        onClick={() => handle('declined')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 border border-[#D6D3D1] text-[#78716C] font-medium py-2 rounded-lg text-sm hover:bg-[#F5F5F4] transition-all duration-150 cursor-pointer disabled:opacity-50"
      >
        <X className="w-3.5 h-3.5" /> Decline
      </button>
      <button
        onClick={() => handle('accepted')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-2 rounded-lg text-sm transition-all duration-150 cursor-pointer disabled:opacity-50"
      >
        <Check className="w-3.5 h-3.5" /> {loading === 'accept' ? 'Accepting...' : 'Accept'}
      </button>
    </div>
  )
}
