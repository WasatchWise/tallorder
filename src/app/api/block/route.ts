import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = rateLimit(`block:${user.id}`, 20, 3600_000)
  if (!allowed) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const { blocked_id } = await req.json()
  if (!blocked_id) return NextResponse.json({ error: 'blocked_id is required' }, { status: 400 })
  if (blocked_id === user.id) return NextResponse.json({ error: 'Cannot block yourself' }, { status: 400 })

  // Insert block (ignore if already exists)
  await supabase.from('blocks').upsert(
    { blocker_id: user.id, blocked_id },
    { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true }
  )

  // Also decline/remove any existing connection
  await supabase
    .from('connections')
    .update({ status: 'blocked' })
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${blocked_id}),and(requester_id.eq.${blocked_id},receiver_id.eq.${user.id})`)

  // Audit log
  try {
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'user_blocked',
      metadata: { blocked_id },
    })
  } catch { /* audit log is non-critical */ }

  return NextResponse.json({ success: true })
}
