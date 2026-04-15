'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Calendar, MapPin, Loader2, Coins } from 'lucide-react'

const CATEGORIES = [
  { value: 'social', label: 'Social' },
  { value: 'music', label: 'Music' },
  { value: 'sports', label: 'Sports' },
  { value: 'food', label: 'Food & Drink' },
  { value: 'arts', label: 'Arts' },
  { value: 'fitness', label: 'Fitness' },
  { value: 'other', label: 'Other' },
]

export default function CreateEventPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [venue, setVenue] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [category, setCategory] = useState('social')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const dateTime = eventTime
      ? new Date(`${eventDate}T${eventTime}`).toISOString()
      : new Date(`${eventDate}T19:00`).toISOString()

    const res = await fetch('/api/events/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, venue, event_date: dateTime, category }),
    })

    const data = await res.json()

    if (!res.ok) {
      if (data.error === 'insufficient_tokens') {
        setError(`You need ${data.cost} cm to create an event. You have ${data.available}.`)
      } else {
        setError(data.error || 'Something went wrong')
      }
      setLoading(false)
      return
    }

    router.push(`/events/${data.eventId}`)
  }

  // Min date = today
  const today = new Date().toISOString().split('T')[0]

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <div className="max-w-[640px] mx-auto px-4 py-6">
        <Link href="/events" className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Events
        </Link>

        <div className="bg-white border border-[#E7E5E4] rounded-xl p-6">
          <h1 className="text-xl font-bold text-[#1C1917] mb-1">Create an event</h1>
          <p className="text-xs text-[#78716C] mb-6 flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5 text-[#D97706]" />
            Costs 2 cm. You earn 1 cm for each RSVP.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-[#1C1917] mb-1">Event name</label>
              <input
                id="name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Friday night volleyball at Liberty Park"
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="venue" className="block text-sm font-medium text-[#1C1917] mb-1">
                Venue <span className="text-[#A8A29E] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-[#A8A29E]" />
                <input
                  id="venue"
                  type="text"
                  maxLength={100}
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  placeholder="Liberty Park, The Beerhive, etc."
                  className="w-full border border-[#E7E5E4] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-[#1C1917] mb-1">Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-[#A8A29E]" />
                  <input
                    id="date"
                    type="date"
                    required
                    min={today}
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full border border-[#E7E5E4] rounded-lg pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="time" className="block text-sm font-medium text-[#1C1917] mb-1">
                  Time <span className="text-[#A8A29E] font-normal">(opt)</span>
                </label>
                <input
                  id="time"
                  type="time"
                  value={eventTime}
                  onChange={e => setEventTime(e.target.value)}
                  className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-[#1C1917] mb-1">Category</label>
              <select
                id="category"
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full border border-[#E7E5E4] rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !eventDate}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Coins className="w-4 h-4" />
                  Create event (2 cm)
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
