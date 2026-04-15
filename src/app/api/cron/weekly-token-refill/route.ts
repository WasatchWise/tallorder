import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { WEEKLY_SUBSCRIBER_REFILL } from '@/lib/constants/stripe'

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Find all active subscribers (paid or founding tier)
  const { data: subscribers, error: subError } = await supabase
    .from('profiles')
    .select('id')
    .in('subscription_tier', ['paid', 'founding'])

  if (subError || !subscribers?.length) {
    console.log('Weekly refill: no active subscribers found', subError)
    return NextResponse.json({ refilled: 0 })
  }

  let refilled = 0
  const tokens = WEEKLY_SUBSCRIBER_REFILL

  for (const sub of subscribers) {
    // Get current balance
    const { data: bal } = await supabase
      .from('token_balances')
      .select('balance, lifetime_earned')
      .eq('user_id', sub.id)
      .maybeSingle()

    if (bal) {
      await supabase.from('token_balances').update({
        balance: bal.balance + tokens,
        lifetime_earned: bal.lifetime_earned + tokens,
      }).eq('user_id', sub.id)
    } else {
      await supabase.from('token_balances').insert({
        user_id: sub.id,
        balance: tokens,
        escrowed: 0,
        lifetime_earned: tokens,
        lifetime_spent: 0,
      })
    }

    // Log the transaction
    await supabase.from('token_transactions').insert({
      user_id: sub.id,
      amount: tokens,
      type: 'weekly_refill',
    })

    refilled++
  }

  console.log(`Weekly refill: credited ${tokens} cm to ${refilled} subscribers`)
  return NextResponse.json({ refilled, tokens })
}
