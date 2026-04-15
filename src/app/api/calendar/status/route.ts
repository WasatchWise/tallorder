import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: activation }, { data: blocks }, { data: bal }] = await Promise.all([
    supabase
      .from('calendar_activations')
      .select('active_until, activated_at')
      .eq('user_id', user.id)
      .maybeSingle(),
    supabase
      .from('profile_availability')
      .select('day_of_week, time_block')
      .eq('user_id', user.id),
    supabase
      .from('token_balances')
      .select('balance, escrowed')
      .eq('user_id', user.id)
      .maybeSingle(),
  ])

  const isActive = !!activation && new Date(activation.active_until) > new Date()
  const availableTokens = (bal?.balance ?? 0) - (bal?.escrowed ?? 0)

  return NextResponse.json({
    active: isActive,
    active_until: activation?.active_until ?? null,
    blocks: isActive ? (blocks ?? []) : [],
    available_tokens: availableTokens,
  })
}
