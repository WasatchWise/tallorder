import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const TOKEN_COST_RSVP = 1

async function rewardOrDeductCreator(
  supabase: Awaited<ReturnType<typeof createClient>>,
  admin: ReturnType<typeof createAdminClient>,
  eventId: string,
  userId: string,
  amount: number
) {
  // Only reward for user-generated events
  const { data: event } = await supabase
    .from('events')
    .select('created_by')
    .eq('id', eventId)
    .eq('source', 'user')
    .maybeSingle()

  if (!event?.created_by || event.created_by === userId) return

  const { data: creatorBal } = await supabase
    .from('token_balances')
    .select('balance, lifetime_earned')
    .eq('user_id', event.created_by)
    .maybeSingle()

  if (!creatorBal) return

  await admin.from('token_balances').update({
    balance: Math.max(0, creatorBal.balance + amount),
    lifetime_earned: Math.max(0, creatorBal.lifetime_earned + amount),
    updated_at: new Date().toISOString(),
  }).eq('user_id', event.created_by)

  await admin.from('token_transactions').insert({
    user_id: event.created_by,
    amount,
    type: amount > 0 ? 'calendar_renew' : 'calendar_spend',
    reference_id: eventId,
  })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { event_id } = await req.json()
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  // Check existing interest
  const { data: existing } = await supabase
    .from('event_interests')
    .select('id')
    .eq('event_id', event_id)
    .eq('user_id', user.id)
    .maybeSingle()

  const admin = createAdminClient()

  if (existing) {
    // Already RSVP'd -- no refunds, you committed
    return NextResponse.json({ interested: true, already: true })
  } else {
    // RSVP: check tokens, deduct, reward creator
    const { data: bal } = await supabase
      .from('token_balances')
      .select('balance, escrowed, lifetime_spent')
      .eq('user_id', user.id)
      .maybeSingle()

    const available = (bal?.balance ?? 0) - (bal?.escrowed ?? 0)
    if (available < TOKEN_COST_RSVP) {
      return NextResponse.json({ error: 'insufficient_tokens', available, cost: TOKEN_COST_RSVP }, { status: 402 })
    }

    const { error: insertError } = await supabase
      .from('event_interests')
      .insert({ event_id, user_id: user.id })

    if (insertError) {
      return NextResponse.json({ error: 'Failed to RSVP' }, { status: 500 })
    }

    await admin.from('token_balances').update({
      balance: (bal?.balance ?? 0) - TOKEN_COST_RSVP,
      lifetime_spent: (bal?.lifetime_spent ?? 0) + TOKEN_COST_RSVP,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id)

    await admin.from('token_transactions').insert({
      user_id: user.id,
      amount: -TOKEN_COST_RSVP,
      type: 'calendar_spend',
      reference_id: event_id,
    })

    await rewardOrDeductCreator(supabase, admin, event_id, user.id, TOKEN_COST_RSVP)
    return NextResponse.json({ interested: true })
  }
}
