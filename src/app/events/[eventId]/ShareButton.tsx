'use client'

import { useState } from 'react'
import { Share2, Check, Copy } from 'lucide-react'

interface Props {
  eventName: string
  eventId: string
  venue?: string | null
  dateLabel: string
}

export default function ShareButton({ eventName, eventId, venue, dateLabel }: Props) {
  const [copied, setCopied] = useState(false)

  const url = `https://tallorder.date/events/${eventId}`
  const text = `${eventName}${venue ? ` at ${venue}` : ''}, ${dateLabel}. Check it out on Tall Order.`

  async function handleShare() {
    // Try native share (mobile)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: eventName, text, url })
        return
      } catch {
        // User cancelled or not supported -- fall through to clipboard
      }
    }

    // Fallback: copy link
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Last resort: prompt
      window.prompt('Copy this link:', url)
    }
  }

  return (
    <button
      onClick={handleShare}
      className="mt-3 w-full flex items-center justify-center gap-2 border border-[#E7E5E4] bg-white text-sm text-[#78716C] font-medium py-3 rounded-xl hover:border-[#D97706] hover:text-[#D97706] transition-colors"
    >
      {copied ? (
        <>
          <Check className="w-4 h-4 text-green-600" />
          <span className="text-green-600">Link copied</span>
        </>
      ) : (
        <>
          <Share2 className="w-4 h-4" />
          Share event
        </>
      )}
    </button>
  )
}
