import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyNewMessage } from '@/lib/email/send'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connectionId, content } = await req.json()
  if (!connectionId || !content?.trim()) {
    return NextResponse.json({ error: 'Missing connectionId or content' }, { status: 400 })
  }

  const trimmed = content.trim()
  if (trimmed.length > 2000) {
    return NextResponse.json({ error: 'Message too long (max 2000 characters)' }, { status: 400 })
  }

  // Verify user is part of this connection and it's accepted
  const { data: connection } = await supabase
    .from('connections')
    .select('id, requester_id, receiver_id, status')
    .eq('id', connectionId)
    .single()

  if (!connection || connection.status !== 'accepted') {
    return NextResponse.json({ error: 'Connection not found or not active' }, { status: 403 })
  }

  const isRequester = connection.requester_id === user.id
  const isReceiver = connection.receiver_id === user.id
  if (!isRequester && !isReceiver) {
    return NextResponse.json({ error: 'Not your connection' }, { status: 403 })
  }

  // Insert message
  const { data: message, error } = await supabase
    .from('messages')
    .insert({ connection_id: connectionId, sender_id: user.id, content: trimmed })
    .select('id, created_at')
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 })
  }

  // Send email notification to the other person (fire-and-forget)
  const recipientId = isRequester ? connection.receiver_id : connection.requester_id
  const admin = createAdminClient()

  const [authRes, senderProfile, recipientProfile] = await Promise.all([
    admin.auth.admin.getUserById(recipientId),
    admin.from('profiles').select('pseudonym').eq('id', user.id).maybeSingle(),
    admin.from('profiles').select('pseudonym').eq('id', recipientId).maybeSingle(),
  ])

  const recipientEmail = authRes.data?.user?.email
  const senderPseudonym = senderProfile.data?.pseudonym ?? 'Someone'
  const recipientPseudonym = recipientProfile.data?.pseudonym ?? 'there'

  if (recipientEmail) {
    notifyNewMessage(recipientEmail, recipientPseudonym, senderPseudonym)
  }

  return NextResponse.json({ id: message.id, created_at: message.created_at })
}
