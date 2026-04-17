import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rateLimit'

const TOKEN_COST_CREATE = 2
const MAX_TITLE_LENGTH = 100
const MAX_VENUE_LENGTH = 100

const VALID_CATEGORIES = ['sports', 'music', 'social', 'arts', 'food', 'fitness', 'other'] as const

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = await rateLimit(`event-create:${user.id}`, 5, 3600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('city, state, subscription_tier')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) return NextResponse.json({ error: 'Profile required' }, { status: 400 })

  const body = await req.json()
  const { name, venue, event_date, category } = body

  // Validate
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return NextResponse.json({ error: 'Event name is required' }, { status: 400 })
  }
  if (name.length > MAX_TITLE_LENGTH) {
    return NextResponse.json({ error: `Name must be ${MAX_TITLE_LENGTH} characters or less` }, { status: 400 })
  }
  if (venue && venue.length > MAX_VENUE_LENGTH) {
    return NextResponse.json({ error: `Venue must be ${MAX_VENUE_LENGTH} characters or less` }, { status: 400 })
  }
  if (!event_date) {
    return NextResponse.json({ error: 'Event date is required' }, { status: 400 })
  }
  const eventDateObj = new Date(event_date)
  if (isNaN(eventDateObj.getTime()) || eventDateObj < new Date()) {
    return NextResponse.json({ error: 'Event date must be in the future' }, { status: 400 })
  }
  if (category && !VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }

  // Check token balance
  const { data: bal } = await supabase
    .from('token_balances')
    .select('balance, escrowed, lifetime_spent')
    .eq('user_id', user.id)
    .maybeSingle()

  const available = (bal?.balance ?? 0) - (bal?.escrowed ?? 0)
  if (available < TOKEN_COST_CREATE) {
    return NextResponse.json({ error: 'insufficient_tokens', available, cost: TOKEN_COST_CREATE }, { status: 402 })
  }

  // Create event (city/state from profile)
  const { data: event, error: eventError } = await supabase
    .from('events')
    .insert({
      name: name.trim(),
      venue: venue?.trim() || null,
      city: profile.city,
      state: profile.state,
      event_date: eventDateObj.toISOString(),
      category: category || 'social',
      source: 'user',
      created_by: user.id,
    })
    .select('id')
    .single()

  if (eventError || !event) {
    console.error('Event create error:', eventError?.message)
    return NextResponse.json({ error: 'Failed to create event' }, { status: 500 })
  }

  // Deduct tokens
  const admin = createAdminClient()
  await admin.from('token_balances').update({
    balance: (bal?.balance ?? 0) - TOKEN_COST_CREATE,
    lifetime_spent: (bal?.lifetime_spent ?? 0) + TOKEN_COST_CREATE,
    updated_at: new Date().toISOString(),
  }).eq('user_id', user.id)

  // Log transaction
  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -TOKEN_COST_CREATE,
    type: 'calendar_spend',
    reference_id: event.id,
  })

  // Auto-mark creator as interested
  await supabase.from('event_interests').insert({
    event_id: event.id,
    user_id: user.id,
  })

  return NextResponse.json({ success: true, eventId: event.id })
}
