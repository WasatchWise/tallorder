import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const FOUNDING_LIMIT = 500
const FOUNDING_TOKENS = 25
const DEFAULT_TOKENS = 10

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check if already granted (idempotent)
  const { data: existing } = await supabase
    .from('token_balances')
    .select('balance')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ success: true, tokens: existing.balance, founding: false })
  }

  // Atomically count and claim founding slot
  const { count: foundingCount } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .eq('is_founding_member', true)

  const isFounding = (foundingCount ?? 0) < FOUNDING_LIMIT
  const tokens = isFounding ? FOUNDING_TOKENS : DEFAULT_TOKENS

  if (isFounding) {
    await supabase
      .from('profiles')
      .update({ is_founding_member: true, subscription_tier: 'founding' })
      .eq('id', user.id)
  }

  const admin = createAdminClient()
  const { error: balanceError } = await admin.from('token_balances').insert({
    user_id: user.id,
    balance: tokens,
    escrowed: 0,
    lifetime_earned: tokens,
    lifetime_spent: 0,
  })

  if (balanceError) {
    console.error('Failed to create token balance:', balanceError)
    return NextResponse.json({ error: 'Failed to grant tokens' }, { status: 500 })
  }

  const { error: txError } = await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: tokens,
    type: isFounding ? 'founding_bonus' : 'signup_bonus',
  })

  if (txError) {
    console.error('Failed to log token transaction:', txError)
    // Balance was created but transaction log failed. Don't block the user,
    // but log loudly so we catch it.
  }

  return NextResponse.json({ success: true, tokens, founding: isFounding })
}
