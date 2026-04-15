import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ balance: 0 })

  const { data } = await supabase
    .from('token_balances')
    .select('balance, escrowed')
    .eq('user_id', user.id)
    .single()

  const available = (data?.balance ?? 0) - (data?.escrowed ?? 0)
  return NextResponse.json({ balance: available })
}
