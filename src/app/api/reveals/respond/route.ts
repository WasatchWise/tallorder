import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { revealId, action } = await req.json()
  if (!revealId || !['approve', 'decline'].includes(action)) {
    return NextResponse.json({ error: 'revealId and action (approve|decline) required' }, { status: 400 })
  }

  // Fetch reveal -- user must be the owner
  const { data: reveal } = await supabase
    .from('photo_reveals')
    .select('id, requester_id, owner_id, status, tokens_spent, expires_at')
    .eq('id', revealId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!reveal) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (reveal.status !== 'pending') return NextResponse.json({ error: 'Already resolved' }, { status: 409 })

  // Check if expired
  const isExpired = reveal.expires_at && new Date(reveal.expires_at) < new Date()
  const effectiveAction = isExpired ? 'decline' : action
  const effectiveStatus = isExpired ? 'expired' : action === 'approve' ? 'approved' : 'declined'

  const now = new Date().toISOString()

  // Update reveal status
  await supabase.from('photo_reveals').update({
    status: effectiveStatus,
    resolved_at: now,
  }).eq('id', revealId)

  // Get requester's balance
  const { data: requesterBal } = await supabase
    .from('token_balances')
    .select('balance, escrowed, lifetime_spent')
    .eq('user_id', reveal.requester_id)
    .maybeSingle()

  const admin = createAdminClient()

  if (effectiveAction === 'approve') {
    // Consume escrow: remove from escrowed, lifetime_spent already counted at request time
    await admin.from('token_balances').update({
      escrowed: Math.max(0, (requesterBal?.escrowed ?? 0) - reveal.tokens_spent),
      updated_at: now,
    }).eq('user_id', reveal.requester_id)

    await admin.from('token_transactions').insert({
      user_id: reveal.requester_id,
      amount: -reveal.tokens_spent,
      type: 'reveal_consume',
      reference_id: revealId,
    })

    // Check if owner earns a token (1 token per 3 approvals)
    const { count } = await supabase
      .from('photo_reveals')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', user.id)
      .eq('status', 'approved')

    if (count && count % 3 === 0) {
      // Credit 1 token to owner
      const { data: ownerBal } = await supabase
        .from('token_balances')
        .select('balance, lifetime_earned')
        .eq('user_id', user.id)
        .maybeSingle()

      if (ownerBal) {
        await admin.from('token_balances').update({
          balance: ownerBal.balance + 1,
          lifetime_earned: ownerBal.lifetime_earned + 1,
          updated_at: now,
        }).eq('user_id', user.id)
      } else {
        await admin.from('token_balances').insert({
          user_id: user.id,
          balance: 1,
          lifetime_earned: 1,
        })
      }

      await admin.from('token_transactions').insert({
        user_id: user.id,
        amount: 1,
        type: 'reveal_earn',
        reference_id: revealId,
      })
    }
  } else {
    // Refund: return tokens from escrow to available balance
    await admin.from('token_balances').update({
      balance: (requesterBal?.balance ?? 0) + reveal.tokens_spent,
      escrowed: Math.max(0, (requesterBal?.escrowed ?? 0) - reveal.tokens_spent),
      lifetime_spent: Math.max(0, (requesterBal?.lifetime_spent ?? 0) - reveal.tokens_spent),
      updated_at: now,
    }).eq('user_id', reveal.requester_id)

    await admin.from('token_transactions').insert({
      user_id: reveal.requester_id,
      amount: reveal.tokens_spent,
      type: 'reveal_refund',
      reference_id: revealId,
    })
  }

  return NextResponse.json({ success: true, status: effectiveStatus })
}
