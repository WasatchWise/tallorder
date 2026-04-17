import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rateLimit'
import { notifyRevealRequest } from '@/lib/email/send'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = await rateLimit(`reveal:${user.id}`, 10, 3600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests. Try again later.' }, { status: 429 })

  const { targetId } = await req.json()
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 })
  if (targetId === user.id) return NextResponse.json({ error: 'Cannot reveal yourself' }, { status: 400 })

  // Block reveals targeting admin accounts
  const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', targetId).maybeSingle()
  if (targetProfile?.role === 'admin') return NextResponse.json({ error: 'Cannot reveal admin accounts' }, { status: 403 })

  // Check for existing pending reveal to this target
  const { data: existing } = await supabase
    .from('photo_reveals')
    .select('id')
    .eq('requester_id', user.id)
    .eq('owner_id', targetId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return NextResponse.json({ error: 'already_pending' }, { status: 409 })

  // Check 30-day cooldown (declined or expired in last 30 days)
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const { data: recent } = await supabase
    .from('photo_reveals')
    .select('id')
    .eq('requester_id', user.id)
    .eq('owner_id', targetId)
    .in('status', ['declined', 'expired'])
    .gte('resolved_at', cutoff)
    .maybeSingle()

  if (recent) return NextResponse.json({ error: 'cooldown_active' }, { status: 429 })

  // Atomically escrow tokens — blocks concurrent requests from racing
  const admin = createAdminClient()
  const { data: deduct } = await admin.rpc('request_reveal_tokens', {
    p_user_id: user.id,
    p_amount: 3,
  })
  const result = deduct?.[0]
  if (!result?.ok) {
    return NextResponse.json({ error: 'insufficient_tokens', available: result?.available_after ?? 0 }, { status: 402 })
  }

  const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()

  // Create reveal record
  const { data: reveal, error: revealError } = await supabase
    .from('photo_reveals')
    .insert({
      requester_id: user.id,
      owner_id: targetId,
      status: 'pending',
      tokens_spent: 3,
      expires_at: expiresAt,
    })
    .select('id')
    .single()

  if (revealError || !reveal) {
    // Compensate: reverse the atomic escrow (balance was decremented 3, escrowed was incremented 3)
    await admin.rpc('release_escrowed_tokens', { p_user_id: user.id, p_amount: 3 })
    return NextResponse.json({ error: 'Failed to create reveal' }, { status: 500 })
  }

  // Log transaction
  await admin.from('token_transactions').insert({
    user_id: user.id,
    amount: -3,
    type: 'reveal_escrow',
    reference_id: reveal.id,
  })

  // Notify photo owner (fire-and-forget)
  try {
    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('pseudonym')
      .eq('id', targetId)
      .maybeSingle()
    const { data: ownerAuth } = await admin.auth.admin.getUserById(targetId)
    const ownerEmail = ownerAuth?.user?.email
    if (ownerEmail) {
      notifyRevealRequest(ownerEmail, ownerProfile?.pseudonym ?? 'there')
    }
  } catch {
    // Email notification failed silently -- reveal was still created
  }

  return NextResponse.json({ success: true, revealId: reveal.id })
}
