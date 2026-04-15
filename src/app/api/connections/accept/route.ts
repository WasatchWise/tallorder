import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { notifyConnectionAccepted } from '@/lib/email/send'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connectionId } = await req.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

  // Verify user is the receiver
  const { data: connection } = await supabase
    .from('connections')
    .select('id, requester_id, receiver_id, status')
    .eq('id', connectionId)
    .eq('receiver_id', user.id)
    .maybeSingle()

  if (!connection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (connection.status !== 'pending') return NextResponse.json({ error: 'Already resolved' }, { status: 409 })

  await supabase
    .from('connections')
    .update({ status: 'accepted' })
    .eq('id', connectionId)

  // Send notification email to requester (fire-and-forget)
  const { data: requesterProfile } = await supabase
    .from('profiles')
    .select('pseudonym')
    .eq('id', connection.requester_id)
    .maybeSingle()

  const admin = createAdminClient()
  const { data: requesterAuth } = await admin.auth.admin.getUserById(connection.requester_id)
  const requesterEmail = requesterAuth?.user?.email
  const requesterPseudonym = requesterProfile?.pseudonym ?? 'there'

  if (requesterEmail) {
    notifyConnectionAccepted(requesterEmail, requesterPseudonym)
  }

  return NextResponse.json({ success: true })
}
