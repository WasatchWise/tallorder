import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/send'

const DAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const BLOCK_LABELS: Record<string, string> = {
  morning: 'morning (6am-12pm)',
  afternoon: 'afternoon (12pm-6pm)',
  evening: 'evening (6pm-12am)',
}

type Overlap = { partner_id: string; day_of_week: number; time_block: string }

export async function runAvailabilityMatching(userId: string): Promise<void> {
  const admin = createAdminClient()

  const { data: overlaps, error } = await admin.rpc('find_availability_overlaps', { p_user_id: userId })
  if (error || !overlaps || overlaps.length === 0) return

  const { data: myAuth } = await admin.auth.admin.getUserById(userId)
  const { data: myProfile } = await admin
    .from('profiles')
    .select('pseudonym')
    .eq('id', userId)
    .maybeSingle()

  const myEmail = myAuth?.user?.email
  const myPseudonym = myProfile?.pseudonym ?? 'there'

  // Group overlaps by partner
  const byPartner = new Map<string, Overlap[]>()
  for (const row of overlaps as Overlap[]) {
    const list = byPartner.get(row.partner_id) ?? []
    list.push(row)
    byPartner.set(row.partner_id, list)
  }

  for (const [partnerId, blocks] of byPartner) {
    const { data: partnerAuth } = await admin.auth.admin.getUserById(partnerId)
    const { data: partnerProfile } = await admin
      .from('profiles')
      .select('pseudonym')
      .eq('id', partnerId)
      .maybeSingle()

    const partnerEmail = partnerAuth?.user?.email
    const partnerPseudonym = partnerProfile?.pseudonym ?? 'there'

    // Build the overlap description
    const firstBlock = blocks[0]
    const dayLabel = DAY_LABELS[firstBlock.day_of_week]
    const blockLabel = BLOCK_LABELS[firstBlock.time_block] ?? firstBlock.time_block
    const extra = blocks.length - 1
    const windowText = extra > 0
      ? `${dayLabel} ${blockLabel} (and ${extra} other window${extra > 1 ? 's' : ''})`
      : `${dayLabel} ${blockLabel}`

    const makeHtml = (toPseudonym: string, otherPseudonym: string) => `
      <p>Hey ${toPseudonym},</p>
      <p>You and <strong>${otherPseudonym}</strong> are both free <strong>${windowText}</strong>.</p>
      <p>Head to your messages to reach out. Neither of you can see the other's schedule. Only this overlap was surfaced.</p>
      <p style="margin-top:20px">
        <a href="https://tallorder.date/messages" style="background:#D97706;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
          Open Messages
        </a>
      </p>
      <p style="color:#999;font-size:12px;margin-top:28px">
        You received this because you both have active availability calendars on Tall Order.
        Your full schedule is never visible to anyone.
      </p>
    `

    if (myEmail) {
      sendEmail({
        to: myEmail,
        subject: `You and ${partnerPseudonym} are both free ${dayLabel} ${BLOCK_LABELS[firstBlock.time_block] ?? firstBlock.time_block}`,
        html: makeHtml(myPseudonym, partnerPseudonym),
      }).catch(() => {})
    }

    if (partnerEmail) {
      sendEmail({
        to: partnerEmail,
        subject: `You and ${myPseudonym} are both free ${dayLabel} ${BLOCK_LABELS[firstBlock.time_block] ?? firstBlock.time_block}`,
        html: makeHtml(partnerPseudonym, myPseudonym),
      }).catch(() => {})
    }

    // Record all notified blocks -- user_a is always the lesser UUID (enforced by DB CHECK)
    const userA = userId < partnerId ? userId : partnerId
    const userB = userId < partnerId ? partnerId : userId
    const rows = blocks.map(b => ({
      user_a: userA,
      user_b: userB,
      day_of_week: b.day_of_week,
      time_block: b.time_block,
    }))
    await admin
      .from('availability_overlap_notifications')
      .upsert(rows, { onConflict: 'user_a,user_b,day_of_week,time_block' })
  }
}
