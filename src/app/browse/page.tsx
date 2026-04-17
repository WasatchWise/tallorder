import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import BrowseFilters from '@/components/browse/BrowseFilters'
import OnboardingTour from '@/components/onboarding/OnboardingTour'
import { MapPin } from 'lucide-react'

type SearchParams = Promise<{ minIn?: string; maxIn?: string; minAge?: string; maxAge?: string; gender?: string; lookingFor?: string; faith?: string; lifestyleTags?: string }>

export default async function BrowsePage({ searchParams }: { searchParams: SearchParams }) {
  const filters = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Check if profile is set up
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) redirect('/onboarding')

  // Fetch blocked user IDs (both directions)
  const { data: blocksOut } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', user.id)
  const { data: blocksIn } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocked_id', user.id)

  // Fetch accepted connection partner IDs
  const { data: connections } = await supabase
    .from('connections')
    .select('requester_id, receiver_id')
    .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
    .eq('status', 'accepted')

  const excludedIds = [
    user.id,
    ...(blocksOut ?? []).map(b => b.blocked_id),
    ...(blocksIn ?? []).map(b => b.blocker_id),
    ...(connections ?? []).map(c =>
      c.requester_id === user.id ? c.receiver_id : c.requester_id
    ),
  ]

  // Build profile query with filters
  let query = supabase
    .from('profiles')
    .select(`
      id, pseudonym, height_ft, height_in, city, state,
      bio, looking_for, interested_in, lifestyle_tags, is_verified, last_active, date_of_birth,
      photos(storage_path, blur_level_default, is_primary, approved)
    `)
    .eq('city', profile.city)
    .neq('role', 'admin')
    .neq('role', 'suspended')
    .not('id', 'in', `(${excludedIds.join(',')})`)

  // Height filter (total inches)
  if (filters.minIn) {
    const minFt = Math.floor(Number(filters.minIn) / 12)
    const minInches = Number(filters.minIn) % 12
    query = query.or(`height_ft.gt.${minFt},and(height_ft.eq.${minFt},height_in.gte.${minInches})`)
  }
  if (filters.maxIn) {
    const maxFt = Math.floor(Number(filters.maxIn) / 12)
    const maxInches = Number(filters.maxIn) % 12
    query = query.or(`height_ft.lt.${maxFt},and(height_ft.eq.${maxFt},height_in.lte.${maxInches})`)
  }

  // Age filter (via date_of_birth)
  if (filters.minAge) {
    const maxDob = new Date()
    maxDob.setFullYear(maxDob.getFullYear() - Number(filters.minAge))
    query = query.lte('date_of_birth', maxDob.toISOString().split('T')[0])
  }
  if (filters.maxAge) {
    const minDob = new Date()
    minDob.setFullYear(minDob.getFullYear() - Number(filters.maxAge) - 1)
    query = query.gte('date_of_birth', minDob.toISOString().split('T')[0])
  }

  // Gender filter
  if (filters.gender) {
    query = query.eq('gender', filters.gender)
  }

  // Looking for filter (overlap -- profile must include at least one selected value)
  if (filters.lookingFor) {
    const vals = filters.lookingFor.split(',')
    query = query.overlaps('looking_for', vals)
  }

  // Faith filter
  if (filters.faith) {
    query = query.eq('faith', filters.faith)
  }

  // Lifestyle tags filter (overlap -- profile must include at least one selected tag)
  if (filters.lifestyleTags) {
    const tags = filters.lifestyleTags.split(',')
    query = query.overlaps('lifestyle_tags', tags)
  }

  // Political compatibility: if current user has set tolerance, auto-filter
  if (profile.political_tolerance_min !== null && profile.political_tolerance_max !== null) {
    query = query
      .gte('political_position', profile.political_tolerance_min)
      .lte('political_position', profile.political_tolerance_max)
  }

  const { data: profiles } = await query
    .order('last_active', { ascending: false })
    .limit(48)

  // Resolve photo storage paths to signed URLs (15-min expiry).
  // For blurred photos (blur_level_default > 1), serve a 20x20 transform so the raw
  // full-resolution bytes are never sent to the browser — CSS blur alone is bypassable
  // via DevTools. blur_level 1 means the owner opted into full visibility on browse.
  const profilesWithUrls = await Promise.all((profiles ?? []).map(async p => {
    const photos = (p.photos as Record<string, unknown>[]) ?? []
    return {
      ...p,
      photos: await Promise.all(photos.map(async ph => {
        let url: string | null = null
        if (ph.approved && ph.storage_path) {
          const blurLevel = (ph.blur_level_default as number) ?? 3
          const needsTransform = blurLevel > 1
          const { data } = await supabase.storage.from('tall-order-photos').createSignedUrl(
            ph.storage_path as string,
            900,
            needsTransform ? { transform: { width: 20, height: 20, resize: 'cover' } } : undefined
          )
          url = data?.signedUrl ?? null
        }
        return { ...ph, url }
      })),
    }
  }))

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />
      {!profile.onboarding_completed && <OnboardingTour userId={user.id} />}

      <div className="max-w-[1152px] mx-auto px-4 py-6">
        {/* Header row */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-[#1C1917]">Browse</h1>
            <p className="text-sm text-[#78716C] flex items-center gap-1 mt-0.5">
              <MapPin className="w-3.5 h-3.5" /> {profile.city}
              {profile.state && `, ${profile.state}`}
            </p>
          </div>
          <BrowseFilters activeCount={Object.values(filters).filter(Boolean).length} />
        </div>

        {/* Profile grid */}
        {!profiles || profiles.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-lg font-semibold text-[#1C1917] mb-2">No one in your city yet.</p>
            <p className="text-[#78716C] text-sm max-w-sm mx-auto">
              You might be the first. That's kind of cool. Tell a tall friend about Tall Order.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {profilesWithUrls.map((p) => (
              <ProfileCard key={p.id} profile={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function calcAge(dob: string | null): number | null {
  if (!dob) return null
  return Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
}

function ProfileCard({ profile }: { profile: Record<string, unknown> }) {
  const heightDisplay = `${profile.height_ft}'${profile.height_in || 0}"`
  const age = calcAge(profile.date_of_birth as string | null)
  const photos = (profile.photos as Record<string, unknown>[]) ?? []
  const primaryPhoto = photos.find(ph => ph.is_primary) ?? photos[0]
  const blurLevel = (primaryPhoto?.blur_level_default as number) ?? 3
  const blurPx = [0, 4, 12, 24, 40][blurLevel - 1] ?? 12
  const photoUrl = primaryPhoto?.url as string | null

  return (
    <a
      href={`/profile/${profile.pseudonym}`}
      className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden block cursor-pointer hover:-translate-y-0.5 transition-transform duration-150"
    >
      {/* Photo */}
      <div className="aspect-[3/4] bg-stone-200 relative overflow-hidden">
        {primaryPhoto && photoUrl ? (
          <img
            src={photoUrl}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ filter: `blur(${blurPx}px)`, transform: 'scale(1.1)' }}
          />
        ) : primaryPhoto ? (
          <div
            className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-400"
            style={{ filter: `blur(${blurPx}px)`, transform: 'scale(1.1)' }}
          />
        ) : (
          <div className="absolute inset-0 bg-stone-200 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-stone-300" />
          </div>
        )}
        {!!profile.is_verified && (
          <span className="absolute top-2 left-2 text-xs bg-[#16A34A] text-white px-1.5 py-0.5 rounded font-medium">
            Verified
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-sm font-semibold text-[#1C1917] truncate">{profile.pseudonym as string}</span>
          <span className="text-sm font-medium text-[#D97706] shrink-0 ml-2" style={{ fontFamily: 'monospace' }}>
            {heightDisplay}
          </span>
        </div>
        <p className="text-xs text-[#78716C] mb-2">{profile.city as string}{age !== null ? ` · ${age}` : ''}</p>
        {!!profile.bio && (
          <p className="text-xs text-[#78716C] line-clamp-2 leading-relaxed mb-2">{profile.bio as string}</p>
        )}
        {(() => {
          const tags = (profile.lifestyle_tags as string[]) ?? []
          const interestedIn = profile.interested_in as string | null
          const chips = [
            ...(interestedIn ? [interestedIn === 'men' ? 'Into men' : interestedIn === 'women' ? 'Into women' : 'Into everyone'] : []),
            ...tags.slice(0, 2),
          ]
          return chips.length > 0 ? (
            <div className="flex flex-wrap gap-1 mt-1">
              {chips.map(chip => (
                <span key={chip} className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-medium leading-tight">
                  {chip}
                </span>
              ))}
            </div>
          ) : null
        })()}
      </div>
    </a>
  )
}
