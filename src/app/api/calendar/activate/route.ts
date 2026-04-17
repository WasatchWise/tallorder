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

  // Atomically check balance and deduct
  const admin = createAdminClient()
  const { data: deduct } = await admin.rpc('spend_tokens', {
    p_user_id: user.id,
    p_amount: ACTIVATE_COST,
  })
  const result = deduct?.[0]
  if (!result?.ok) {
    return NextResponse.json({ error: 'insufficient_tokens', available: result?.available_after ?? 0 }, { status: 402 })
  }

  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -ACTIVATE_COST,
    type: 'calendar_spend',
  })

  const activeUntil = new Date(Date.now() + WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString()

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
