'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

export default function CancelRequestButton({ connectionId }: { connectionId: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleCancel() {
    if (!confirm('Cancel this connection request?')) return
    setLoading(true)
    await fetch('/api/connections/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ connectionId }),
    })
    router.refresh()
  }

  return (
    <button
      onClick={handleCancel}
      disabled={loading}
      className="text-xs text-[#78716C] hover:text-red-600 transition-colors disabled:opacity-50 p-1"
      aria-label="Cancel request"
    >
      <X className="w-4 h-4" />
    </button>
  )
}
