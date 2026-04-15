import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { runAvailabilityMatching } from '@/lib/calendar/matching'

type Block = { day_of_week: number; time_block: string }

const VALID_BLOCKS = ['morning', 'afternoon', 'evening']

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Must have an active calendar to save blocks
  const { data: activation } = await supabase
    .from('calendar_activations')
    .select('active_until')
    .eq('user_id', user.id)
    .maybeSingle()

  if (!activation || new Date(activation.active_until) <= new Date()) {
    return NextResponse.json({ error: 'calendar_not_active' }, { status: 403 })
  }

  const { blocks } = await req.json() as { blocks: Block[] }

  // Validate input
  if (!Array.isArray(blocks)) {
    return NextResponse.json({ error: 'blocks must be an array' }, { status: 400 })
  }
  for (const b of blocks) {
    if (typeof b.day_of_week !== 'number' || b.day_of_week < 0 || b.day_of_week > 6) {
      return NextResponse.json({ error: 'invalid day_of_week' }, { status: 400 })
    }
    if (!VALID_BLOCKS.includes(b.time_block)) {
      return NextResponse.json({ error: 'invalid time_block' }, { status: 400 })
    }
  }

  // Replace all blocks for this user atomically (delete then insert)
  await supabase.from('profile_availability').delete().eq('user_id', user.id)

  if (blocks.length > 0) {
    const rows = blocks.map(b => ({
      user_id: user.id,
      day_of_week: b.day_of_week,
      time_block: b.time_block,
    }))
    const { error } = await supabase.from('profile_availability').insert(rows)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Run matching asynchronously -- fire-and-forget so response is fast
  runAvailabilityMatching(user.id).catch(() => {})

  return NextResponse.json({ success: true, saved: blocks.length })
}
