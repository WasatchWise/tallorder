import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  let next = searchParams.get('next') ?? '/onboarding'
  // Prevent open redirect: must start with / and not contain //
  if (!next.startsWith('/') || next.includes('//')) next = '/onboarding'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        try {
          await supabase.from('audit_log').insert({
            user_id: user.id,
            action: 'user_login',
            metadata: { method: 'magic_link' },
          })
        } catch { /* audit log is non-critical */ }
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`)
}
