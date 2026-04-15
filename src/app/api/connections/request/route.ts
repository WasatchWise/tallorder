import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyConnectionRequest } from '@/lib/email/send'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = rateLimit(`connect:${user.id}`, 20, 86_400_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { targetId, introMessage } = await req.json()
  if (!targetId) return NextResponse.json({ error: 'targetId required' }, { status: 400 })
  if (targetId === user.id) return NextResponse.json({ error: 'Cannot connect with yourself' }, { status: 400 })

  // Block connections to/from admin accounts
  const { data: targetProfile } = await supabase.from('profiles').select('role').eq('id', targetId).maybeSingle()
  if (targetProfile?.role === 'admin') return NextResponse.json({ error: 'Cannot connect with admin accounts' }, { status: 403 })

  const { data: connection, error } = await supabase
    .from('connections')
    .insert({
      requester_id: user.id,
      receiver_id: targetId,
      intro_message: introMessage?.trim() || null,
      status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'already_exists' }, { status: 409 })
    console.error('Connection insert error:', error)
    return NextResponse.json({ error: 'Failed to send request' }, { status: 500 })
  }

  // Send notification email to receiver (fire-and-forget, never block response)
  try {
    const { data: receiver } = await supabase
      .from('profiles')
      .select('pseudonym')
      .eq('id', targetId)
      .maybeSingle()

    const admin = createAdminClient()
    const { data: receiverAuth } = await admin.auth.admin.getUserById(targetId)
    const receiverEmail = receiverAuth?.user?.email
    const receiverPseudonym = receiver?.pseudonym ?? 'there'

    if (receiverEmail) {
      notifyConnectionRequest(receiverEmail, receiverPseudonym)
    }
  } catch {
    // Email notification failed silently -- connection was still created
  }

  return NextResponse.json({ success: true, connectionId: connection.id })
}
