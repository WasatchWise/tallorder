import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/email/unsubscribe?uid=<user_id>&t=nudge
// One-click unsubscribe from the Sunday availability nudge emails.
// Uses a simple uid param. No auth required so the link works from email clients.

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const uid = searchParams.get('uid')
  const type = searchParams.get('t') // currently only 'nudge'

  if (!uid || type !== 'nudge') {
    return new NextResponse(page('Invalid unsubscribe link.'), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('profiles')
    .update({ email_nudge_unsubscribed: true })
    .eq('id', uid)

  if (error) {
    return new NextResponse(page('Something went wrong. Please try again later.'), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    })
  }

  return new NextResponse(
    page("You've been unsubscribed from weekly availability nudges. You can re-enable them in Settings any time."),
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  )
}

function page(message: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Tall Order - Email Preferences</title>
<style>
  body { font-family: system-ui, sans-serif; background: #F5F5F4; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
  .card { background: white; border: 1px solid #E7E5E4; border-radius: 12px; padding: 32px; max-width: 400px; text-align: center; }
  p { color: #1C1917; font-size: 15px; line-height: 1.5; }
  a { color: #D97706; text-decoration: none; font-weight: 600; }
</style>
</head>
<body>
  <div class="card">
    <p>${message}</p>
    <p style="margin-top:20px"><a href="https://tallorder.date/settings">Back to Settings</a></p>
  </div>
</body>
</html>`
}
