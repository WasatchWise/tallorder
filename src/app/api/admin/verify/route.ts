import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? 'admin@wasatchwise.com'
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
  const { id, action } = await req.json() // action: 'approve' | 'reject'

  // Verify admin via cookie-based session
  const { createClient: createServerClient } = await import('@/lib/supabase/server')
  const userClient = await createServerClient()
  const { data: { user } } = await userClient.auth.getUser()
  if (!user || user.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (!id || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Get submission to find user_id
  const { data: submission } = await supabase
    .from('verification_submissions')
    .select('user_id')
    .eq('id', id)
    .maybeSingle()

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 })
  }

  // Update submission status
  await supabase
    .from('verification_submissions')
    .update({ status: action === 'approve' ? 'approved' : 'rejected', reviewed_at: now })
    .eq('id', id)

  // If approved, set is_verified on profile
  if (action === 'approve') {
    await supabase
      .from('profiles')
      .update({ is_verified: true })
      .eq('id', submission.user_id)
  }

  // Audit log
  await supabase.from('audit_log').insert({
    user_id: user.id,
    action: action === 'approve' ? 'verification_approved' : 'verification_rejected',
    metadata: { submission_id: id, target_user_id: submission.user_id },
  })

  return NextResponse.json({ ok: true })
}
