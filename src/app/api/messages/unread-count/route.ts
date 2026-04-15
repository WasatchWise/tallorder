import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Get all connections where this user is a participant
  const { data: connections } = await supabase
    .from('connections')
    .select('id')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')

  if (!connections || connections.length === 0) {
    return NextResponse.json({ count: 0 })
  }

  const connectionIds = connections.map(c => c.id)

  // Count unread messages sent by others in those connections
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .in('connection_id', connectionIds)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return NextResponse.json({ count: count ?? 0 })
}
