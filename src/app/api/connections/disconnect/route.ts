import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyDisconnection } from '@/lib/email/send'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connectionId } = await req.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

  // Verify user is a party to this connection
  const { data: connection } = await supabase
    .from('connections')
    .select('id, requester_id, receiver_id, status')
    .eq('id', connectionId)
    .maybeSingle()

  if (!connection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (connection.requester_id !== user.id && connection.receiver_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (connection.status !== 'accepted') {
    return NextResponse.json({ error: 'Not an active connection' }, { status: 409 })
  }

  await supabase
    .from('connections')
    .update({ status: 'disconnected' })
    .eq('id', connectionId)

  // Notify the other person (fire-and-forget, no details about who disconnected)
  const otherId = connection.requester_id === user.id ? connection.receiver_id : connection.requester_id
  const admin = createAdminClient()
  const [otherAuth, otherProfile] = await Promise.all([
    admin.auth.admin.getUserById(otherId),
    admin.from('profiles').select('pseudonym').eq('id', otherId).maybeSingle(),
  ])

  const otherEmail = otherAuth.data?.user?.email
  const otherPseudonym = otherProfile.data?.pseudonym ?? 'there'

  if (otherEmail) {
    notifyDisconnection(otherEmail, otherPseudonym)
  }

  return NextResponse.json({ success: true })
}
