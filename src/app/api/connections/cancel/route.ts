import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { connectionId } = await req.json()
  if (!connectionId) return NextResponse.json({ error: 'connectionId required' }, { status: 400 })

  // Only the requester can cancel, and only if still pending
  const { data: connection } = await supabase
    .from('connections')
    .select('id, requester_id, status')
    .eq('id', connectionId)
    .eq('requester_id', user.id)
    .maybeSingle()

  if (!connection) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (connection.status !== 'pending') return NextResponse.json({ error: 'Already resolved' }, { status: 409 })

  await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId)

  return NextResponse.json({ success: true })
}
