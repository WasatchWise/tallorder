import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@wasatchwise.com'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { action, type, id } = await req.json()
  // type: 'photo' | 'report'
  // action: 'approve' | 'reject' | 'resolve' | 'escalate'

  if (type === 'photo') {
    if (action === 'approve') {
      await supabase.from('photos').update({ approved: true }).eq('id', id)
    } else if (action === 'reject') {
      await supabase.from('photos').delete().eq('id', id)
    }
  } else if (type === 'report') {
    const status = action === 'resolve' ? 'resolved' : action === 'escalate' ? 'escalated' : action === 'suspend' ? 'resolved' : 'reviewed'
    await supabase.from('reports').update({
      status,
      reviewed_at: new Date().toISOString(),
    }).eq('id', id)

    // If suspending, get the reported user and set their role to suspended
    if (action === 'suspend') {
      const { data: report } = await supabase
        .from('reports')
        .select('reported_id')
        .eq('id', id)
        .maybeSingle()

      if (report?.reported_id) {
        const admin = createAdminClient()
        await admin
          .from('profiles')
          .update({ role: 'suspended' })
          .eq('id', report.reported_id)

        // Also hide them from browse by removing approved photos
        await admin
          .from('photos')
          .update({ approved: false })
          .eq('user_id', report.reported_id)
      }
    }
  }

  try {
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: `admin_${type}_${action}`,
      metadata: { id },
    })
  } catch { /* audit log is non-critical */ }

  return NextResponse.json({ success: true })
}
