import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'user_login',
      metadata: { method: 'password' },
    })
  } catch { /* audit log is non-critical */ }

  return NextResponse.json({ ok: true })
}
