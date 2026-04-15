'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, Loader2, Coins, Ruler, Users } from 'lucide-react'

interface Attendee {
  pseudonym: string
  height: string
  interested_in: string | null
  looking_for: string[]
  city: string | null
}

interface Props {
  eventId: string
  userId: string
  initialInterested: boolean
  initialCount: number
  attendees: Attendee[]
}

export default function EventInterestButton({ eventId, userId, initialInterested, initialCount, attendees }: Props) {
  const [interested, setInterested] = useState(initialInterested)
  const [count, setCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRsvp() {
    if (interested) return // Already committed, no toggle
    setLoading(true)
    setError(null)

    const res = await fetch('/api/events/interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.error === 'insufficient_tokens') {
        setError(`You need ${data.cost} cm to RSVP. You have ${data.available}.`)
      } else {
        setError(data.error || 'Something went wrong')
      }
      setLoading(false)
      return
    }

    setInterested(true)
    setCount(c => c + 1)
    setLoading(false)
  }

  return (
    <div>
      <button
        onClick={handleRsvp}
        disabled={loading || interested}
        className={`w-full flex items-center justify-center gap-2 font-semibold py-3 rounded-xl transition-colors duration-150 ${
          interested
            ? 'bg-[#D97706] text-white cursor-default'
            : 'bg-white border border-[#E7E5E4] text-[#1C1917] hover:border-[#D97706] cursor-pointer'
        } disabled:opacity-80`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : interested ? (
          <Star className="w-4 h-4 fill-white" />
        ) : (
          <Coins className="w-4 h-4 text-[#D97706]" />
        )}
        {interested ? "You're going" : "See who's going (1 cm)"}
      </button>
      {!interested && (
        <p className="text-xs text-center text-[#A8A29E] mt-1.5">Commit your spot and unlock the attendee list.</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-2 text-center">{error}</p>
      )}

      {/* Attendee list -- only visible after RSVP */}
      {interested && attendees.length > 0 && (
        <div className="mt-4 bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <div className="flex items-center gap-2 px-4 pt-4 pb-2">
            <Users className="w-4 h-4 text-[#D97706]" />
            <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider">
              Scouting report ({attendees.length} attending)
            </p>
          </div>
          <div className="divide-y divide-[#E7E5E4]">
            {attendees.map(a => (
              <Link
                key={a.pseudonym}
                href={`/profile/${encodeURIComponent(a.pseudonym)}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
              >
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">{a.pseudonym}</p>
                  {a.city && (
                    <p className="text-[10px] text-[#A8A29E] mt-0.5">{a.city}</p>
                  )}
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {a.looking_for.map(lf => (
                      <span key={lf} className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{lf}</span>
                    ))}
                    {a.interested_in && (
                      <span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full">{a.interested_in}</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-[#D97706] font-medium" style={{ fontFamily: 'monospace' }}>
                  <Ruler className="w-3 h-3" />
                  {a.height}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
      {interested && attendees.length === 0 && (
        <p className="text-xs text-center text-[#A8A29E] mt-3">You're the first one here. Share this event to get others interested.</p>
      )}
    </div>
  )
}
