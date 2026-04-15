import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ACTIVATE_COST = 5
const WINDOW_DAYS = 14

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if already active
  const { data: existing } = await supabase
    .from('calendar_activations')
    .select('active_until')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing && new Date(existing.active_until) > new Date()) {
    return NextResponse.json({ error: 'already_active', active_until: existing.active_until }, { status: 409 })
  }

  // Check token balance
  const { data: bal } = await supabase
    .from('token_balances')
    .select('balance, escrowed')
    .eq('user_id', user.id)
    .maybeSingle()

  const available = (bal?.balance ?? 0) - (bal?.escrowed ?? 0)
  if (available < ACTIVATE_COST) {
    return NextResponse.json({ error: 'insufficient_tokens', available }, { status: 402 })
  }

  const activeUntil = new Date(Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

  // Deduct tokens
  const admin = createAdminClient()
  await admin
    .from('token_balances')
    .update({ balance: bal!.balance - ACTIVATE_COST, updated_at: new Date().toISOString() })
    .eq('user_id', user.id)

  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -ACTIVATE_COST,
    type: 'calendar_spend',
  })

  // Create/replace activation
  await supabase
    .from('calendar_activations')
    .upsert({ user_id: user.id, active_until: activeUntil, activated_at: new Date().toISOString() })

  // Clear any stale blocks and overlap notifications from the previous window
  await supabase.from('profile_availability').delete().eq('user_id', user.id)
  await supabase
    .from('availability_overlap_notifications')
    .delete()
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)

  return NextResponse.json({ success: true, active_until: activeUntil, cost: ACTIVATE_COST })
}
