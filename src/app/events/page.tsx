import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Calendar, MapPin, Users, ChevronRight, Plus } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  sports: 'bg-blue-50 text-blue-700',
  music: 'bg-purple-50 text-purple-700',
  social: 'bg-amber-50 text-amber-700',
  arts: 'bg-pink-50 text-pink-700',
  food: 'bg-orange-50 text-orange-700',
  fitness: 'bg-green-50 text-green-700',
  other: 'bg-stone-100 text-stone-600',
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default async function EventsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  const city = profile.city as string | null

  // Events in user's city, upcoming only
  const { data: events } = await supabase
    .from('events')
    .select('id, name, venue, city, state, event_date, category, source')
    .eq('city', city ?? '')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(50)

  // Interest counts + whether current user is interested
  const eventIds = (events ?? []).map((e: { id: string }) => e.id)

  let interestCounts: Record<string, number> = {}
  let myInterests: Set<string> = new Set()

  if (eventIds.length > 0) {
    const { data: interests } = await supabase
      .from('event_interests')
      .select('event_id, user_id')
      .in('event_id', eventIds)

    for (const row of interests ?? []) {
      interestCounts[row.event_id] = (interestCounts[row.event_id] ?? 0) + 1
      if (row.user_id === user.id) myInterests.add(row.event_id)
    }
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[640px] mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">Events</h1>
            {city && (
              <div className="flex items-center gap-1.5 text-xs text-[#78716C] mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {city}{profile.state ? `, ${profile.state}` : ''}
              </div>
            )}
          </div>
          <Link
            href="/events/create"
            className="flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create
          </Link>
        </div>

        {!events?.length ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-10 text-center">
            <Calendar className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1C1917] mb-1">No upcoming events yet</p>
            <p className="text-xs text-[#78716C] max-w-xs mx-auto mb-4">
              Be the first to create an event in {city ?? 'your city'}. Earn cm when others RSVP.
            </p>
            <Link
              href="/events/create"
              className="inline-flex items-center gap-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create the first event
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {(events as Array<{
              id: string
              name: string
              venue: string | null
              city: string
              state: string | null
              event_date: string
              category: string | null
              source: string | null
            }>).map(event => {
              const cat = event.category ?? 'other'
              const colorClass = CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other
              const count = interestCounts[event.id] ?? 0
              const interested = myInterests.has(event.id)

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-start gap-4 hover:border-[#D97706] transition-colors duration-150 block"
                >
                  {/* Date block */}
                  <div className="shrink-0 w-12 text-center bg-[#F5F5F4] rounded-lg py-2">
                    <p className="text-xs font-medium text-[#78716C] uppercase">
                      {new Date(event.event_date).toLocaleDateString('en-US', { month: 'short' })}
                    </p>
                    <p className="text-xl font-bold text-[#1C1917] leading-none">
                      {new Date(event.event_date).getDate()}
                    </p>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#1C1917] leading-tight">{event.name}</p>
                      <ChevronRight className="w-4 h-4 text-[#D6D3D1] shrink-0 mt-0.5" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 mt-1.5">
                      {cat !== 'other' && (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${colorClass}`}>
                          {cat}
                        </span>
                      )}
                      {event.venue && (
                        <span className="text-xs text-[#78716C] flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {event.venue}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <p className="text-xs text-[#A8A29E]">
                        {new Date(event.event_date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </p>
                      {count > 0 && (
                        <p className="text-xs text-[#78716C] flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {count} {count === 1 ? 'member' : 'members'} interested
                          {interested && <span className="text-[#D97706] font-medium"> (you)</span>}
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
