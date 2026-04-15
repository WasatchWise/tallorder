import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { rateLimit } from '@/lib/rateLimit'

const VALID_CATEGORIES = ['fake_profile', 'harassment', 'inappropriate_photos', 'dangerous_behavior', 'spam', 'other']

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { success: allowed } = rateLimit(`report:${user.id}`, 5, 86_400_000)
  if (!allowed) return NextResponse.json({ error: 'Too many reports. Please wait.' }, { status: 429 })

  const { reported_id, category, description } = await req.json()

  if (!reported_id || !category) {
    return NextResponse.json({ error: 'reported_id and category are required' }, { status: 400 })
  }
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
  }
  if (reported_id === user.id) {
    return NextResponse.json({ error: 'Cannot report yourself' }, { status: 400 })
  }

  const { error } = await supabase.from('reports').insert({
    reporter_id: user.id,
    reported_id,
    category,
    description: description ?? null,
    status: 'pending',
  })

  if (error) {
    console.error('[report]', error)
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 })
  }

  // Audit log
  try {
    await supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'report_submitted',
      metadata: { reported_id, category },
    })
  } catch { /* audit log is non-critical */ }

  return NextResponse.json({ success: true })
}
