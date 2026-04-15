'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

export default function ManageSubscriptionButton() {
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    setLoading(true)
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const { url, error } = await res.json()
    if (url) {
      window.location.href = url
    } else {
      console.error('Portal error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex items-center gap-2 text-xs font-semibold text-[#D97706] hover:underline disabled:opacity-50 cursor-pointer"
    >
      {loading ? 'Loading...' : (
        <>Manage / cancel <ExternalLink className="w-3 h-3" /></>
      )}
    </button>
  )
}
