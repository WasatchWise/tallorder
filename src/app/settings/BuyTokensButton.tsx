'use client'

import { useState } from 'react'
import { TOKEN_PACK_PRICES } from '@/lib/constants/stripe'
import { Plus } from 'lucide-react'

type PackSize = keyof typeof TOKEN_PACK_PRICES

const packs: { size: PackSize; info: typeof TOKEN_PACK_PRICES[PackSize] }[] = [
  { size: 'small', info: TOKEN_PACK_PRICES.small },
  { size: 'medium', info: TOKEN_PACK_PRICES.medium },
  { size: 'large', info: TOKEN_PACK_PRICES.large },
]

export default function BuyTokensButton() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState<PackSize | null>(null)

  async function handleBuy(pack: PackSize) {
    setLoading(pack)
    try {
      const res = await fetch('/api/stripe/token-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack }),
      })
      const { url, error } = await res.json()
      if (url) {
        window.location.href = url
      } else {
        alert(error || 'Something went wrong. Try again.')
        setLoading(null)
      }
    } catch {
      alert('Something went wrong. Try again.')
      setLoading(null)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1 text-xs font-semibold text-[#D97706] hover:underline cursor-pointer"
      >
        <Plus className="w-3 h-3" /> Get more
      </button>
    )
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs text-[#78716C]">Buy a token pack</p>
      {packs.map(({ size, info }) => (
        <button
          key={size}
          onClick={() => handleBuy(size)}
          disabled={loading !== null}
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-lg border border-[#E7E5E4] hover:border-[#D97706] hover:bg-amber-50/50 transition-colors disabled:opacity-50 cursor-pointer"
        >
          <span className="text-sm font-medium text-[#1C1917]">
            {info.label}
            {size === 'medium' && (
              <span className="ml-2 text-[10px] font-semibold text-[#D97706] uppercase">Best value</span>
            )}
          </span>
          <span className="text-sm font-semibold text-[#1C1917]">
            {loading === size ? 'Loading...' : info.price}
          </span>
        </button>
      ))}
      <button
        onClick={() => setOpen(false)}
        className="text-xs text-[#A8A29E] hover:text-[#78716C] cursor-pointer"
      >
        Cancel
      </button>
    </div>
  )
}
