import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import EventInterestButton from './EventInterestButton'
import ShareButton from './ShareButton'
import { ArrowLeft, MapPin, Calendar, Users, ExternalLink, Ruler } from 'lucide-react'

const LOOKING_FOR_LABELS: Record<string, string> = {
  dating: 'Dating',
  friends: 'Friends',
  activity_partners: 'Activity partners',
  open: 'Open to anything',
}

const INTERESTED_IN_LABELS: Record<string, string> = {
  men: 'Into men',
  women: 'Into women',
  everyone: 'Into everyone',
}

export default async function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .maybeSingle()

  if (!event) notFound()

  const { data: interests, count: totalInterested } = await supabase
    .from('event_interests')
    .select('id, user_id, profiles!inner(pseudonym, height_ft, height_in, interested_in, looking_for, city)', { count: 'exact' })
    .eq('event_id', eventId)

  const myInterest = interests?.find(i => i.user_id === user.id) ?? null
  const attendees = (interests ?? [])
    .filter(i => i.user_id !== user.id)
    .map(i => {
      const p = i.profiles as unknown as { pseudonym: string; height_ft: number; height_in: number; interested_in: string | null; looking_for: string[] | null; city: string | null }
      return {
        pseudonym: p.pseudonym,
        height: `${p.height_ft}'${p.height_in || 0}"`,
        interested_in: p.interested_in ? INTERESTED_IN_LABELS[p.interested_in] ?? p.interested_in : null,
        looking_for: p.looking_for?.map(v => LOOKING_FOR_LABELS[v] ?? v) ?? [],
        city: p.city,
      }
    })

  const dateObj = new Date(event.event_date)
  const dateLabel = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const timeLabel = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[640px] mx-auto px-4 py-6">
        <Link href="/events" className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Events
        </Link>

        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden mb-4">
          {/* Header block */}
          <div className="bg-[#1C1917] px-5 py-6">
            {event.category && event.category !== 'other' && (
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 capitalize">{event.category}</p>
            )}
            <h1 className="text-xl font-bold text-white leading-snug">{event.name}</h1>
          </div>

          {/* Details */}
          <div className="p-5 space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-[#1C1917]">{dateLabel}</p>
                <p className="text-xs text-[#78716C]">{timeLabel}</p>
              </div>
            </div>

            {event.venue && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">{event.venue}</p>
                  <p className="text-xs text-[#78716C]">{event.city}{event.state ? `, ${event.state}` : ''}</p>
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 text-[#D97706] shrink-0" />
              <p className="text-sm text-[#78716C]">
                {totalInterested ?? 0} Tall Order {(totalInterested ?? 0) === 1 ? 'member' : 'members'} interested
              </p>
            </div>

            {event.description && (
              <p className="text-sm text-[#44403C] leading-relaxed pt-2 border-t border-[#E7E5E4]">
                {event.description}
              </p>
            )}
          </div>
        </div>

        {/* Interest CTA */}
        <EventInterestButton
          eventId={eventId}
          userId={user.id}
          initialInterested={!!myInterest}
          initialCount={totalInterested ?? 0}
          attendees={attendees}
        />

        <ShareButton
          eventName={event.name}
          eventId={eventId}
          venue={event.venue}
          dateLabel={dateLabel}
        />

        {event.url && (
          <a
            href={event.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 w-full flex items-center justify-center gap-2 border border-[#E7E5E4] bg-white text-sm text-[#78716C] font-medium py-3 rounded-xl hover:border-[#D6D3D1] transition-colors"
          >
            View on {event.source ?? 'event page'} <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  )
}
