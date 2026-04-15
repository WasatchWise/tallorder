'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  pseudonym: string
  variant?: 'settings' | 'inline'
}

export default function InviteButton({ pseudonym, variant = 'settings' }: Props) {
  const [copied, setCopied] = useState(false)

  const refCode = encodeURIComponent(pseudonym)
  const url = `https://tallorder.date?ref=${refCode}`
  const text = `Join me on Tall Order - a dating and social app for tall people. ${url}`

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Tall Order',
          text: 'Join me on Tall Order - a dating and social app for tall people.',
          url,
        })
        return
      } catch {
        // User cancelled or share failed, fall through to copy
      }
    }

    // Fallback: copy to clipboard
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Last resort: prompt
      window.prompt('Copy this link:', url)
    }
  }

  if (variant === 'inline') {
    return (
      <button
        onClick={handleShare}
        className="flex items-center gap-2 text-sm font-semibold text-[#D97706] hover:text-[#B45309] transition-colors cursor-pointer"
      >
        {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        {copied ? 'Link copied!' : 'Invite tall friends'}
      </button>
    )
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center justify-between w-full px-5 py-3.5 hover:bg-stone-50 transition-colors border-t border-[#E7E5E4] cursor-pointer"
    >
      <div className="flex items-center gap-3">
        <Share2 className="w-4 h-4 text-[#D97706]" />
        <div>
          <p className="text-sm text-[#1C1917] text-left">Invite tall friends</p>
          <p className="text-xs text-[#A8A29E]">Share your personal invite link</p>
        </div>
      </div>
      {copied ? (
        <Check className="w-4 h-4 text-[#16A34A]" />
      ) : (
        <Copy className="w-4 h-4 text-[#A8A29E]" />
      )}
    </button>
  )
}
