'use client'

import { useState } from 'react'

interface Props {
  userId: string
  priceId: string
  label: string
  isFounding?: boolean
  variant?: 'primary' | 'ghost'
}

export default function SubscribeButton({ userId, priceId, label, isFounding = false, variant = 'primary' }: Props) {
  const [loading, setLoading] = useState(false)

  const [error, setError] = useState<string | null>(null)

  async function checkout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId, userId, founding: isFounding }),
      })
      if (!res.ok) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.error || !data.url) {
        setError('Something went wrong. Please try again.')
        setLoading(false)
        return
      }
      window.location.href = data.url
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  if (variant === 'ghost') {
    return (
      <div>
        <button
          onClick={checkout}
          disabled={loading}
          className="w-full py-2.5 text-sm text-stone-400 hover:text-white font-medium transition-colors duration-150 cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Redirecting...' : label}
        </button>
        {error && <p className="text-xs text-red-400 text-center mt-1">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={checkout}
        disabled={loading}
        className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
      >
        {loading ? 'Redirecting to checkout...' : label}
      </button>
      {error && <p className="text-xs text-red-400 text-center mt-1">{error}</p>}
    </div>
  )
}
