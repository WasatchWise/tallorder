import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-10-29.clover' as const })
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const session = event.data.object as Stripe.Checkout.Session | Stripe.Subscription

  // Idempotency: deduplicate Stripe retries via event_id primary key
  const { error: dupError } = await supabase
    .from('stripe_events')
    .insert({ event_id: event.id })
  if (dupError) {
    // 23505 = unique_violation → already processed
    if (dupError.code === '23505') return NextResponse.json({ received: true })
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const cs = session as Stripe.Checkout.Session
      const userId = cs.metadata?.user_id
      if (!userId) break

      // Token pack purchase (one-time payment)
      if (cs.metadata?.type === 'token_pack') {
        const tokens = parseInt(cs.metadata.tokens ?? '0', 10)
        if (tokens > 0) {
          // Credit the tokens
          const { data: existing } = await supabase
            .from('token_balances')
            .select('balance, lifetime_earned')
            .eq('user_id', userId)
            .maybeSingle()

          if (existing) {
            await supabase.from('token_balances').update({
              balance: existing.balance + tokens,
              lifetime_earned: existing.lifetime_earned + tokens,
            }).eq('user_id', userId)
          } else {
            await supabase.from('token_balances').insert({
              user_id: userId,
              balance: tokens,
              escrowed: 0,
              lifetime_earned: tokens,
              lifetime_spent: 0,
            })
          }

          // Log the transaction
          await supabase.from('token_transactions').insert({
            user_id: userId,
            amount: tokens,
            type: 'purchase',
            reference_id: cs.id,
          })
        }
        break
      }

      // Subscription checkout
      const isFounding = cs.metadata?.founding === 'true'
      await supabase.from('subscriptions').upsert({
        user_id: userId,
        stripe_customer_id: cs.customer as string,
        stripe_subscription_id: cs.subscription as string,
        tier: 'paid',
        status: 'active',
        is_founding_member: isFounding,
      }, { onConflict: 'user_id' })
      // Keep profiles.subscription_tier and is_founding_member in sync
      const profileTier = isFounding ? 'founding' : 'paid'
      await supabase.from('profiles').update({
        subscription_tier: profileTier,
        is_founding_member: isFounding,
      }).eq('id', userId)
      break
    }
    case 'customer.subscription.updated': {
      const sub = session as Stripe.Subscription
      const { data } = await supabase
        .from('subscriptions')
        .select('user_id, is_founding_member')
        .eq('stripe_subscription_id', sub.id)
        .maybeSingle()
      if (data?.user_id) {
        const isActive = sub.status === 'active' || sub.status === 'trialing'
        const tier = isActive ? 'paid' : 'free'
        await supabase.from('subscriptions').update({
          status: sub.status,
          tier,
          current_period_end: new Date((sub as any).current_period_end * 1000).toISOString(),
        }).eq('stripe_subscription_id', sub.id)
        // Preserve founding status on the profile when subscription is active
        const profileTier = isActive && data.is_founding_member ? 'founding' : tier
        await supabase.from('profiles').update({ subscription_tier: profileTier }).eq('id', data.user_id)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const sub = session as Stripe.Subscription
      await supabase.from('subscriptions').update({ status: 'canceled', tier: 'free' }).eq('stripe_subscription_id', sub.id)
      const { data } = await supabase.from('subscriptions').select('user_id').eq('stripe_subscription_id', sub.id).maybeSingle()
      if (data?.user_id) {
        // Downgrade profile but keep is_founding_member true so re-sub can restore the rate
        await supabase.from('profiles').update({ subscription_tier: 'free' }).eq('id', data.user_id)
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
