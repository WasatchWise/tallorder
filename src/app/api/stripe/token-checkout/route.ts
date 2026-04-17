import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'
import { TOKEN_PACK_PRICES } from '@/lib/constants/stripe'

type PackSize = keyof typeof TOKEN_PACK_PRICES

export async function POST(req: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2025-10-29.clover' as const })
  const { pack } = await req.json() as { pack: PackSize }

  const packInfo = TOKEN_PACK_PRICES[pack]
  if (!packInfo?.priceId) {
    return NextResponse.json({ error: 'Invalid token pack' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = await rateLimit(`token-checkout:${user.id}`, 5, 3600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://tallorder.date'

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: packInfo.priceId, quantity: 1 }],
      success_url: `${appUrl}/settings?tokens=purchased`,
      cancel_url: `${appUrl}/settings`,
      customer_email: user.email,
      metadata: {
        user_id: user.id,
        type: 'token_pack',
        pack,
        tokens: String(packInfo.tokens),
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Token checkout failed'
    console.error('Token checkout error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
