import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import MessageThread from '@/components/messaging/MessageThread'

export default async function ConversationPage({ params }: { params: Promise<{ connectionId: string }> }) {
  const { connectionId } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  // Check subscription
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status')
    .eq('user_id', user.id)
    .maybeSingle()
  const isPaid = (sub?.tier === 'paid' && sub?.status === 'active')
    || profile.subscription_tier === 'paid'
    || profile.subscription_tier === 'founding'
  if (!isPaid) redirect('/subscription')

  // Verify the connection exists and user is a party to it
  const { data: connection } = await supabase
    .from('connections')
    .select(`
      id, requester_id, receiver_id, status,
      requester:profiles!connections_requester_id_fkey(id, pseudonym),
      receiver:profiles!connections_receiver_id_fkey(id, pseudonym)
    `)
    .eq('id', connectionId)
    .maybeSingle()

  if (!connection || connection.status !== 'accepted') notFound()
  if (connection.requester_id !== user.id && connection.receiver_id !== user.id) notFound()

  const other = connection.requester_id === user.id
    ? connection.receiver as unknown as { id: string; pseudonym: string }
    : connection.requester as unknown as { id: string; pseudonym: string }

  // Load initial messages
  const { data: messages } = await supabase
    .from('messages')
    .select('id, sender_id, content, read_at, created_at')
    .eq('connection_id', connectionId)
    .order('created_at', { ascending: true })
    .limit(100)

  // Mark messages as read
  await supabase
    .from('messages')
    .update({ read_at: new Date().toISOString() })
    .eq('connection_id', connectionId)
    .neq('sender_id', user.id)
    .is('read_at', null)

  return (
    <div className="min-h-screen bg-[#F5F5F4] flex flex-col">
      <Header user={profile} />
      <MessageThread
        connectionId={connectionId}
        userId={user.id}
        otherPseudonym={other.pseudonym}
        initialMessages={messages ?? []}
      />
    </div>
  )
}
