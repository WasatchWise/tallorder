import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { MessageCircle, Lock } from 'lucide-react'

export default async function MessagesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  // Check subscription (check both subscriptions table and profile tier for consistency)
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .maybeSingle()
  const isPaid = (sub?.tier === 'paid' && sub?.status === 'active')
    || profile.subscription_tier === 'paid'
    || profile.subscription_tier === 'founding'

  if (!isPaid) {
    return (
      <div className="min-h-screen bg-[#F5F5F4]">
        <Header user={profile} />
        <div className="max-w-[640px] mx-auto px-4 py-16 text-center">
          <div className="bg-white border border-[#E7E5E4] rounded-2xl p-8">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
              <Lock className="w-6 h-6 text-[#D97706]" />
            </div>
            <h1 className="text-lg font-bold text-[#1C1917] mb-2">Messaging is a paid feature</h1>
            <p className="text-sm text-[#78716C] mb-6 max-w-xs mx-auto">
              Upgrade to send connection requests and message your matches.
            </p>
            <Link
              href="/subscription"
              className="inline-flex items-center justify-center bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-150"
            >
              See plans, from $4.99/mo
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Get all accepted connections with latest message
  const { data: connections } = await supabase
    .from('connections')
    .select(`
      id, requester_id, receiver_id,
      requester:profiles!connections_requester_id_fkey(id, pseudonym, height_ft, height_in),
      receiver:profiles!connections_receiver_id_fkey(id, pseudonym, height_ft, height_in),
      messages(content, created_at, read_at, sender_id)
    `)
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[640px] mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-[#1C1917] mb-4">Messages</h1>

        {!connections?.length ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 text-center">
            <MessageCircle className="w-8 h-8 text-[#E7E5E4] mx-auto mb-3" />
            <p className="text-sm font-medium text-[#1C1917] mb-1">No conversations yet</p>
            <p className="text-xs text-[#78716C] mb-4">Accept a connection request or send one to start messaging.</p>
            <Link href="/connections" className="text-sm text-[#B45309] font-medium hover:underline">View connections</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {connections.map((c: Record<string, unknown>) => {
              const other = (c.requester_id as string) === user.id
                ? c.receiver as Record<string, unknown>
                : c.requester as Record<string, unknown>
              const msgs = (c.messages as Record<string, unknown>[]) ?? []
              const latest = msgs.sort((a, b) =>
                new Date(b.created_at as string).getTime() - new Date(a.created_at as string).getTime()
              )[0]
              const unread = msgs.filter(m => !m.read_at && m.sender_id !== user.id).length

              return (
                <Link
                  key={c.id as string}
                  href={`/messages/${c.id}`}
                  className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-center gap-3 hover:border-[#D97706] transition-colors duration-150 block"
                >
                  <div className="w-10 h-10 rounded-full bg-stone-200 shrink-0 flex items-center justify-center">
                    <span className="text-sm font-semibold text-[#78716C]">
                      {(other.pseudonym as string)[0].toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-sm font-semibold text-[#1C1917]">{other.pseudonym as string}</span>
                      {latest && (
                        <span className="text-xs text-[#78716C] shrink-0 ml-2">
                          {new Date(latest.created_at as string).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#78716C] truncate">
                      {latest ? latest.content as string : 'No messages yet'}
                    </p>
                  </div>
                  {unread > 0 && (
                    <span className="w-5 h-5 rounded-full bg-[#D97706] text-white text-xs flex items-center justify-center font-semibold shrink-0">
                      {unread}
                    </span>
                  )}
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
