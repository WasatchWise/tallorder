'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserMinus } from 'lucide-react'

export default function DisconnectButton({ connectionId, pseudonym }: { connectionId: string; pseudonym: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function disconnect() {
    setLoading(true)
    await fetch('/api/connections/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    })
    router.refresh()
    setLoading(false)
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#78716C]">Remove {pseudonym}?</span>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs text-[#A8A29E] hover:text-[#1C1917] transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={disconnect}
          disabled={loading}
          className="text-xs font-semibold text-red-500 hover:text-red-700 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Removing...' : 'Confirm'}
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="p-1.5 text-[#D6D3D1] hover:text-red-400 transition-colors cursor-pointer"
      title="Disconnect"
    >
      <UserMinus className="w-4 h-4" />
    </button>
  )
}
