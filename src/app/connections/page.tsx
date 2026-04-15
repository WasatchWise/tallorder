import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Link from 'next/link'
import { Clock, Check, X, MessageCircle, Eye } from 'lucide-react'
import AcceptDeclineButtons from '@/components/connections/AcceptDeclineButtons'
import RevealRespondButtons from '@/components/connections/RevealRespondButtons'
import DisconnectButton from '@/components/connections/DisconnectButton'
import CancelRequestButton from '@/components/connections/CancelRequestButton'

export default async function ConnectionsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  const { data: incoming } = await supabase
    .from('connections')
    .select('id, status, intro_message, created_at, requester:profiles!connections_requester_id_fkey(id, pseudonym, height_ft, height_in, city)')
    .eq('receiver_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const { data: accepted } = await supabase
    .from('connections')
    .select('id, requester_id, receiver_id, created_at, requester:profiles!connections_requester_id_fkey(id, pseudonym, height_ft, height_in, city), receiver:profiles!connections_receiver_id_fkey(id, pseudonym, height_ft, height_in, city)')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')
    .order('created_at', { ascending: false })

  const { data: outgoing } = await supabase
    .from('connections')
    .select('id, status, created_at, receiver:profiles!connections_receiver_id_fkey(id, pseudonym, height_ft, height_in, city)')
    .eq('requester_id', user.id)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Incoming photo reveal requests (pending, not expired)
  const { data: revealRequests } = await supabase
    .from('photo_reveals')
    .select('id, created_at, expires_at, requester:profiles!photo_reveals_requester_id_fkey(id, pseudonym, height_ft, height_in, city)')
    .eq('owner_id', user.id)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[640px] mx-auto px-4 py-6 space-y-6">

        {/* Incoming photo reveal requests */}
        {revealRequests && revealRequests.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-3">
              Photo reveal requests ({revealRequests.length})
            </h2>
            <div className="space-y-3">
              {revealRequests.map((r: Record<string, unknown>) => {
                const req = r.requester as Record<string, unknown>
                const height = `${req.height_ft}'${req.height_in || 0}"`
                const expiresAt = new Date(r.expires_at as string)
                const hoursLeft = Math.max(0, Math.round((expiresAt.getTime() - Date.now()) / 3600000))
                return (
                  <div key={r.id as string} className="bg-white border border-[#E7E5E4] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <Eye className="w-3.5 h-3.5 text-[#D97706]" />
                          <span className="text-xs font-semibold text-[#D97706]">Wants to see your photos</span>
                        </div>
                        <Link href={`/profile/${req.pseudonym}`} className="font-semibold text-[#1C1917] hover:text-[#D97706] transition-colors text-sm">
                          {req.pseudonym as string}
                        </Link>
                        <p className="text-xs text-[#78716C]">{req.city as string} · <span className="font-mono text-[#D97706]">{height}</span></p>
                      </div>
                      <span className="text-xs text-[#A8A29E]">{hoursLeft}h left</span>
                    </div>
                    <RevealRespondButtons revealId={r.id as string} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Incoming requests */}
        {incoming && incoming.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-3">
              Requests for you ({incoming.length})
            </h2>
            <div className="space-y-3">
              {incoming.map((c: Record<string, unknown>) => {
                const req = c.requester as Record<string, unknown>
                const height = `${req.height_ft}'${req.height_in || 0}"`
                return (
                  <div key={c.id as string} className="bg-white border border-[#E7E5E4] rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <Link href={`/profile/${req.pseudonym}`} className="font-semibold text-[#1C1917] hover:text-[#D97706] transition-colors">
                          {req.pseudonym as string}
                        </Link>
                        <p className="text-xs text-[#78716C]">{req.city as string} · <span className="font-mono text-[#D97706]">{height}</span></p>
                      </div>
                    </div>
                    {!!c.intro_message && (
                      <p className="text-sm text-[#78716C] italic mb-3 pl-3 border-l-2 border-[#E7E5E4]">"{c.intro_message as string}"</p>
                    )}
                    <AcceptDeclineButtons connectionId={c.id as string} />
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Accepted connections */}
        <section>
          <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-3">
            Connections {accepted?.length ? `(${accepted.length})` : ''}
          </h2>
          {!accepted?.length ? (
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-8 text-center">
              <p className="text-sm text-[#78716C]">No connections yet. Browse and send a request.</p>
              <Link href="/browse" className="inline-block mt-3 text-sm text-[#B45309] font-medium hover:underline">Browse people</Link>
            </div>
          ) : (
            <div className="space-y-2">
              {accepted.map((c: Record<string, unknown>) => {
                const other = (c.requester_id as string) === user.id
                  ? c.receiver as Record<string, unknown>
                  : c.requester as Record<string, unknown>
                const height = `${other.height_ft}'${other.height_in || 0}"`
                return (
                  <div key={c.id as string} className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <Link href={`/profile/${other.pseudonym}`} className="font-semibold text-[#1C1917] hover:text-[#D97706] transition-colors text-sm">
                        {other.pseudonym as string}
                      </Link>
                      <p className="text-xs text-[#78716C]">{other.city as string} · <span className="font-mono text-[#D97706] text-xs">{height}</span></p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/messages/${c.id}`}
                        className="flex items-center gap-1.5 text-xs font-semibold bg-[#D97706] hover:bg-[#B45309] text-white px-3 py-2 rounded-lg transition-colors duration-150"
                      >
                        <MessageCircle className="w-3.5 h-3.5" /> Message
                      </Link>
                      <DisconnectButton connectionId={c.id as string} pseudonym={other.pseudonym as string} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Outgoing pending */}
        {outgoing && outgoing.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-3">
              Pending sent ({outgoing.length})
            </h2>
            <div className="space-y-2">
              {outgoing.map((c: Record<string, unknown>) => {
                const rec = c.receiver as Record<string, unknown>
                return (
                  <div key={c.id as string} className="bg-white border border-[#E7E5E4] rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-[#78716C] shrink-0" />
                      <Link href={`/profile/${rec.pseudonym}`} className="text-sm font-medium text-[#1C1917] hover:text-[#D97706] transition-colors">
                        {rec.pseudonym as string}
                      </Link>
                    </div>
                    <CancelRequestButton connectionId={c.id as string} />
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
