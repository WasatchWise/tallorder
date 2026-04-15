import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

export async function POST() {
  const supabase = await createServerClient()
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = rateLimit(`delete:${user.id}`, 3, 3600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const userId = user.id

  // Delete user's photos from storage
  const { data: photos } = await adminSupabase
    .from('photos')
    .select('storage_path')
    .eq('user_id', userId)

  if (photos && photos.length > 0) {
    const paths = photos.map(p => p.storage_path).filter(Boolean)
    if (paths.length > 0) {
      await adminSupabase.storage.from('tall-order-photos').remove(paths)
    }
  }

  // Delete from all related tables (order matters for FK constraints)
  await adminSupabase.from('token_transactions').delete().eq('user_id', userId)
  await adminSupabase.from('token_balances').delete().eq('user_id', userId)
  await adminSupabase.from('event_interests').delete().eq('user_id', userId)
  await adminSupabase.from('photo_reveals').delete().or(`requester_id.eq.${userId},owner_id.eq.${userId}`)
  await adminSupabase.from('verification_submissions').delete().eq('user_id', userId)

  // Delete messages in connections where user is a party
  const { data: userConnections } = await adminSupabase
    .from('connections')
    .select('id')
    .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)

  if (userConnections && userConnections.length > 0) {
    const connIds = userConnections.map(c => c.id)
    await adminSupabase.from('messages').delete().in('connection_id', connIds)
  }

  await adminSupabase.from('connections').delete().or(`requester_id.eq.${userId},receiver_id.eq.${userId}`)
  await adminSupabase.from('blocks').delete().or(`blocker_id.eq.${userId},blocked_id.eq.${userId}`)
  await adminSupabase.from('photos').delete().eq('user_id', userId)
  await adminSupabase.from('subscriptions').delete().eq('user_id', userId)

  // Audit log — keep anonymized record
  await adminSupabase.from('audit_log').insert({
    user_id: userId,
    action: 'account_deleted',
    metadata: { deleted_at: new Date().toISOString() },
  })

  // Delete profile
  await adminSupabase.from('profiles').delete().eq('id', userId)

  // Delete auth user
  await adminSupabase.auth.admin.deleteUser(userId)

  return NextResponse.json({ success: true })
}
