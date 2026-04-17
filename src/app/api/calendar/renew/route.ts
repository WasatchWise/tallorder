import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RENEW_COST = 3
const WINDOW_DAYS = 14

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: activation } = await supabase
    .from('calendar_activations')
    .select('active_until')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!activation) {
    return NextResponse.json({ error: 'not_activated' }, { status: 404 })
  }

  // Atomically check balance and deduct
  const admin = createAdminClient()
  const { data: deduct } = await admin.rpc('spend_tokens', {
    p_user_id: user.id,
    p_amount: RENEW_COST,
  })
  const result = deduct?.[0]
  if (!result?.ok) {
    return NextResponse.json({ error: 'insufficient_tokens', available: result?.available_after ?? 0 }, { status: 402 })
  }

  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -RENEW_COST,
    type: 'calendar_renew',
  })

  // Extend from whichever is later: now or current expiry (allows early renewal without losing time)
  const base = new Date(activation.active_until) > new Date() ? new Date(activation.active_until) : new Date()
  const activeUntil = new Date(base.getTime() + WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  await supabase
    .from('calendar_activations')
    .update({ active_until: activeUntil })
    .eq('user_id', user.id)

  return NextResponse.json({ success: true, active_until: activeUntil, cost: RENEW_COST })
}
