import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Header from '@/components/layout/Header'
import ConnectButton from '@/components/profile/ConnectButton'
import ProfileActions from '@/components/profile/ProfileActions'
import PhotoRevealButton from '@/components/profile/PhotoRevealButton'
import { MapPin, CheckCircle2, Ruler } from 'lucide-react'

const LOOKING_FOR_LABELS: Record<string, string> = {
  dating: 'Dating',
  friends: 'Friends',
  activity_partners: 'Activity partners',
  open: 'Open to anything',
}

const INTERESTED_IN_LABELS: Record<string, string> = {
  men: 'Into men',
  women: 'Into women',
  everyone: 'Into everyone',
}

const RELATIONSHIP_STYLE_LABELS: Record<string, string> = {
  monogamous: 'Monogamous',
  open: 'Open to non-monogamy',
  not_sure: 'Not sure yet',
}

const FAITH_LABELS: Record<string, string> = {
  christian: 'Christian',
  catholic: 'Catholic',
  jewish: 'Jewish',
  muslim: 'Muslim',
  hindu: 'Hindu',
  buddhist: 'Buddhist',
  spiritual: 'Spiritual',
  agnostic: 'Agnostic',
  atheist: 'Atheist',
  other: 'Other',
}

const FAITH_IMPORTANCE_LABELS: Record<number, string> = {
  0: 'Not important',
  1: 'Somewhat important',
  2: 'Very important',
  3: 'Non-negotiable',
}

export default async function ProfilePage({ params }: { params: Promise<{ pseudonym: string }> }) {
  const { pseudonym } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: viewer } = await supabase.from('profiles').select('id, pseudonym, subscription_tier').eq('id', user.id).maybeSingle()
  if (!viewer) redirect('/onboarding')

  // Own profile → redirect to edit
  if (viewer.pseudonym === pseudonym) redirect('/profile/edit')

  const { data: profile } = await supabase
    .from('profiles')
    .select(`*, photos(id, storage_path, blur_level_default, is_primary, approved)`)
    .eq('pseudonym', pseudonym)
    .maybeSingle()

  if (!profile) notFound()

  // Check if blocked
  const { data: blocked } = await supabase
    .from('blocks')
    .select('id')
    .or(`and(blocker_id.eq.${user.id},blocked_id.eq.${profile.id}),and(blocker_id.eq.${profile.id},blocked_id.eq.${user.id})`)
    .maybeSingle()
  if (blocked) notFound()

  // Existing connection status
  const { data: connection } = await supabase
    .from('connections')
    .select('id, status, requester_id')
    .or(`and(requester_id.eq.${user.id},receiver_id.eq.${profile.id}),and(requester_id.eq.${profile.id},receiver_id.eq.${user.id})`)
    .maybeSingle()

  // Photo reveal state
  const { data: reveal } = await supabase
    .from('photo_reveals')
    .select('id, status, resolved_at, expires_at')
    .eq('requester_id', user.id)
    .eq('owner_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // 30-day cooldown check
  const cooldownActive = reveal?.status === 'declined' || reveal?.status === 'expired'
    ? new Date(reveal.resolved_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    : false

  const revealStatus = reveal?.status === 'approved'
    ? 'approved'
    : reveal?.status === 'pending' && new Date(reveal.expires_at) > new Date()
    ? 'pending'
    : cooldownActive
    ? 'cooldown'
    : 'none'

  // Token balance
  const { data: tokenBal } = await supabase
    .from('token_balances')
    .select('balance, escrowed')
    .eq('user_id', user.id)
    .maybeSingle()
  const availableTokens = (tokenBal?.balance ?? 0) - (tokenBal?.escrowed ?? 0)

  const age = profile.date_of_birth
    ? Math.floor((Date.now() - new Date(profile.date_of_birth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : null

  const photos = (profile.photos ?? []).filter((p: { approved: boolean }) => p.approved)
  const primaryPhoto = photos.find((p: { is_primary: boolean }) => p.is_primary) ?? photos[0]
  const revealed = revealStatus === 'approved'
  // If reveal is approved, show photos unblurred.
  // When NOT revealed, enforce minimum blur level 2 so level 1 doesn't expose photos.
  const rawBlurLevel = primaryPhoto?.blur_level_default ?? 3
  const blurLevel = revealed ? 1 : Math.max(rawBlurLevel, 2)
  const blurPx = [0, 4, 12, 24, 40][blurLevel - 1] ?? 12
  const heightDisplay = `${profile.height_ft}'${profile.height_in || 0}"`

  // Generate signed URLs for photos (all if revealed, just primary otherwise)
  const photosToShow = revealed ? photos : (primaryPhoto ? [primaryPhoto] : [])
  const photoUrls: (string | null)[] = await Promise.all(
    photosToShow.map(async (p: { storage_path: string }) =>
      p.storage_path
        ? (await supabase.storage.from('tall-order-photos').createSignedUrl(p.storage_path, 900)).data?.signedUrl ?? null
        : null
    )
  )
  const primaryPhotoUrl = photoUrls[0] ?? null

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={viewer} />

      <div className="max-w-[640px] mx-auto px-4 py-6">
        {/* Photo */}
        <div className="aspect-[4/3] rounded-xl overflow-hidden bg-stone-200 mb-6 relative">
          {primaryPhoto && primaryPhotoUrl ? (
            <img
              src={primaryPhotoUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: `blur(${blurPx}px)`, transform: 'scale(1.1)' }}
            />
          ) : primaryPhoto ? (
            <div
              className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-500"
              style={{ filter: `blur(${blurPx}px)`, transform: 'scale(1.1)' }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-24 h-24 rounded-full bg-stone-300" />
            </div>
          )}
          {blurLevel > 1 && (
            <div className="absolute bottom-3 left-3 right-3 flex flex-col items-center gap-2">
              <span className="text-xs bg-black/40 text-white px-2 py-1 rounded-full">
                Photos are blurred by default
              </span>
            </div>
          )}
        </div>

        {/* Additional photos gallery (revealed only) */}
        {revealed && photoUrls.length > 1 && (
          <div className="grid grid-cols-3 gap-2 mb-6">
            {photoUrls.slice(1).map((url, i) => (
              <div key={i} className="aspect-square rounded-lg overflow-hidden bg-stone-200">
                {url && (
                  <img
                    src={url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Identity */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 mb-4">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#1C1917]">{profile.pseudonym}</h1>
                {profile.is_verified && (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                )}
              </div>
              <p className="text-[#78716C] text-sm flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {profile.city}{profile.state ? `, ${profile.state}` : ''}{age !== null ? ` · ${age}` : ''}
              </p>
            </div>
            <div className="flex items-start gap-3">
              <div className="text-right">
                <p className="text-lg font-medium text-[#D97706]" style={{ fontFamily: 'monospace' }}>
                  {heightDisplay}
                </p>
                <p className="text-xs text-[#78716C] flex items-center gap-1 justify-end">
                  <Ruler className="w-3 h-3" /> Height
                </p>
              </div>
              <ProfileActions targetId={profile.id} targetPseudonym={profile.pseudonym} />
            </div>
          </div>

          {profile.bio && (
            <p className="text-sm text-[#1C1917] leading-relaxed mt-3 pt-3 border-t border-[#E7E5E4]">
              {profile.bio}
            </p>
          )}
        </div>

        {/* Looking for + Interested in + Relationship style */}
        {(profile.looking_for?.length > 0 || profile.interested_in || profile.relationship_style) && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 mb-4 space-y-4">
            {profile.interested_in && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Interested in</p>
                <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium">
                  {INTERESTED_IN_LABELS[profile.interested_in] ?? profile.interested_in}
                </span>
              </div>
            )}
            {profile.looking_for?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Looking for</p>
                <div className="flex flex-wrap gap-2">
                  {profile.looking_for.map((val: string) => (
                    <span key={val} className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium">
                      {LOOKING_FOR_LABELS[val] ?? val}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {profile.relationship_style && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Relationship style</p>
                <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium">
                  {RELATIONSHIP_STYLE_LABELS[profile.relationship_style] ?? profile.relationship_style}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Occupation + Lifestyle tags */}
        {(profile.occupation || profile.lifestyle_tags?.length > 0) && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 mb-4 space-y-4">
            {profile.occupation && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-1">Occupation</p>
                <p className="text-sm text-[#1C1917]">{profile.occupation}</p>
              </div>
            )}
            {profile.lifestyle_tags?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Lifestyle</p>
                <div className="flex flex-wrap gap-2">
                  {profile.lifestyle_tags.map((tag: string) => (
                    <span key={tag} className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Faith & Political */}
        {(profile.faith || profile.political_position !== null) && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 mb-4 space-y-4">
            {profile.faith && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Faith</p>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs bg-stone-100 text-stone-600 px-3 py-1.5 rounded-full font-medium">
                    {FAITH_LABELS[profile.faith] ?? profile.faith}
                  </span>
                  {profile.faith_importance !== null && profile.faith_importance !== undefined && (
                    <span className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
                      {FAITH_IMPORTANCE_LABELS[profile.faith_importance] ?? ''}
                    </span>
                  )}
                </div>
              </div>
            )}
            {profile.political_position !== null && (
              <div>
                <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">Political</p>
                <div className="relative h-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-400 to-red-500">
                  <div
                    className="absolute -top-1 w-4 h-4 rounded-full bg-white border-2 border-[#D97706] shadow-sm"
                    style={{ left: `calc(${profile.political_position}% - 8px)` }}
                  />
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-blue-500 font-medium">Liberal</span>
                  <span className="text-[10px] text-red-500 font-medium">Conservative</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Prompt */}
        {profile.prompt_question && profile.prompt_answer && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5 mb-4">
            <p className="text-xs text-[#A8A29E] italic mb-2">{profile.prompt_question}</p>
            <p className="text-sm text-[#1C1917] leading-relaxed">{profile.prompt_answer}</p>
          </div>
        )}

        {/* Photo reveal */}
        {blurLevel > 1 && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl px-5 py-4 mb-4">
            <PhotoRevealButton
              targetId={profile.id}
              revealStatus={revealStatus}
              availableTokens={availableTokens}
            />
          </div>
        )}

        {/* Connect CTA */}
        <ConnectButton
          viewerId={user.id}
          viewerTier={viewer.subscription_tier}
          targetId={profile.id}
          targetPseudonym={profile.pseudonym}
          connection={connection}
        />
      </div>
    </div>
  )
}
