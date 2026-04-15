import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FOUNDING_MEMBER_LIMIT } from '@/lib/constants/stripe'

export async function GET() {
  const supabase = await createClient()
  const { count } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_member', true)

  const claimed = count ?? 0
  return NextResponse.json({ claimed, total: FOUNDING_MEMBER_LIMIT, remaining: FOUNDING_MEMBER_LIMIT - claimed })
}
