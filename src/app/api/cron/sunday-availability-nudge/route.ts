import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'

// Vercel cron: "0 2 * * 1" = 2:00am UTC Monday = ~7-8pm MST Sunday
// Protected by CRON_SECRET set in Vercel env vars

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Find all users with active calendars who haven't updated blocks in 5+ days
  // (skip users who already updated recently -- no point nudging them)
  const cutoff5d = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  const { data: activeUsers } = await admin
    .from('calendar_activations')
    .select('user_id, active_until')
    .gt('active_until', new Date().toISOString())

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ sent: 0 })
  }

  // For each active user, check when they last touched their blocks
  // profile_availability has no updated_at so we use calendar_activations.activated_at as a proxy
  // A user who activated 5+ days ago and hasn't re-saved since hasn't been nudged recently
  const { data: recentSavers } = await admin
    .from('calendar_activations')
    .select('user_id')
    .gt('activated_at', cutoff5d)

  const recentSaverIds = new Set((recentSavers ?? []).map((r: { user_id: string }) => r.user_id))
  const toNudge = activeUsers.filter((u: { user_id: string }) => !recentSaverIds.has(u.user_id))

  let sent = 0
  for (const { user_id, active_until } of toNudge as { user_id: string; active_until: string }[]) {
    const { data: authUser } = await admin.auth.admin.getUserById(user_id)
    const { data: profile } = await admin
      .from('profiles')
      .select('pseudonym, email_nudge_unsubscribed')
      .eq('id', user_id)
      .maybeSingle()

    const email = authUser?.user?.email
    const pseudonym = profile?.pseudonym ?? 'there'
    if (!email) continue
    // Respect unsubscribe preference
    if (profile?.email_nudge_unsubscribed) continue

    const expiresIn = Math.ceil((new Date(active_until).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    const expiryNote = expiresIn <= 3
      ? `<p style="color:#D97706;font-size:13px">Your calendar expires in ${expiresIn} day${expiresIn !== 1 ? 's' : ''}. Renew for 3 cm to keep it going.</p>`
      : ''

    sendEmail({
      to: email,
      subject: 'New week ahead: update your Tall Order availability',
      html: `
        <p>Hey ${pseudonym},</p>
        <p>New week ahead. Update your availability windows so we can match you with connections who are free at the same time.</p>
        <p>Your schedule is never visible to anyone. Only mutual overlaps are surfaced as suggestions.</p>
        ${expiryNote}
        <p style="margin-top:20px">
          <a href="https://tallorder.date/settings/availability" style="background:#D97706;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            Update Availability
          </a>
        </p>
        <p style="color:#999;font-size:12px;margin-top:28px">
          You received this because you have an active availability calendar on Tall Order.<br/>
          <a href="https://tallorder.date/api/email/unsubscribe?uid=${user_id}&t=nudge" style="color:#999;text-decoration:underline">Unsubscribe from these reminders</a>
        </p>
      `,
    }).catch(() => {})

    sent++
  }

  return NextResponse.json({ sent })
}
