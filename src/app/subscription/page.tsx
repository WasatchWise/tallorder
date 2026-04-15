import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import SubscribeButton from '@/components/subscription/SubscribeButton'
import { Check, Star } from 'lucide-react'
import { STRIPE_PRICES, FOUNDING_MEMBER_LIMIT } from '@/lib/constants/stripe'

const FEATURES_FREE = [
  'Create your profile',
  'Browse people in your city',
  'View local events',
  'Receive connection requests',
]

const FEATURES_PAID = [
  'Everything in free',
  'Send unlimited connection requests',
  'Message all your connections',
  'Request photo reveals',
  'Priority in search results',
]

export default async function SubscriptionPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  // Check if already paid
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status, is_founding_member, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPaid = (sub?.tier === 'paid' && sub?.status === 'active')
    || profile.subscription_tier === 'paid'
    || profile.subscription_tier === 'founding'

  // Check founding member availability
  const { count: foundingCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_member', true)
  const foundingAvailable = (foundingCount ?? 0) < FOUNDING_MEMBER_LIMIT
  const foundingRemaining = FOUNDING_MEMBER_LIMIT - (foundingCount ?? 0)

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[720px] mx-auto px-4 py-8">
        {isPaid ? (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6 text-[#D97706]" />
            </div>
            <h1 className="text-xl font-bold text-[#1C1917] mb-1">You're subscribed</h1>
            {(sub?.is_founding_member || profile.subscription_tier === 'founding') && (
              <p className="text-sm text-[#D97706] font-medium mb-2">Founding Member - rate locked forever</p>
            )}
            <p className="text-sm text-[#78716C]">
              Renews {sub?.current_period_end
                ? new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                : 'automatically'}
            </p>
          </div>
        ) : (
          <>
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-[#1C1917] mb-2" style={{ letterSpacing: '-0.02em' }}>Choose your plan</h1>
              {foundingAvailable && (
                <div className="inline-flex items-center gap-1.5 bg-[#FEF3C7] text-[#D97706] text-xs font-semibold px-3 py-1.5 rounded-full">
                  <Star className="w-3 h-3" />
                  {foundingRemaining >= 490
                    ? 'Limited founding spots available - rate locked forever'
                    : `${foundingRemaining} founding member spots left - rate locked forever`}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {/* Free */}
              <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
                <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-1">Free</p>
                <p className="text-3xl font-bold text-[#1C1917] mb-4">$0</p>
                <ul className="space-y-2.5 mb-6">
                  {FEATURES_FREE.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-[#78716C]">
                      <Check className="w-4 h-4 text-[#78716C] shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="border border-[#E7E5E4] rounded-lg py-2.5 text-center text-sm text-[#78716C] font-medium">
                  Current plan
                </div>
              </div>

              {/* Paid */}
              <div className="bg-[#1C1917] border border-[#1C1917] rounded-xl p-5 relative overflow-hidden">
                {foundingAvailable && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-[#D97706] text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                    <Star className="w-2.5 h-2.5" /> Founding
                  </div>
                )}
                <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">Full access</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-3xl font-bold text-white">{foundingAvailable ? '$4.99' : '$9.99'}</span>
                  <span className="text-sm text-stone-400">/mo</span>
                </div>
                {foundingAvailable && (
                  <p className="text-xs text-stone-400 mb-4 line-through">$9.99/mo after founding spots fill</p>
                )}
                <ul className="space-y-2.5 mb-6">
                  {FEATURES_PAID.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-stone-300">
                      <Check className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" /> {f}
                    </li>
                  ))}
                </ul>
                <div className="space-y-2">
                  <SubscribeButton
                    userId={user.id}
                    priceId={foundingAvailable ? STRIPE_PRICES.foundingMonthly : STRIPE_PRICES.monthly}
                    label={foundingAvailable ? 'Claim founding rate - $4.99/mo' : 'Subscribe - $9.99/mo'}
                    isFounding={foundingAvailable}
                  />
                  <SubscribeButton
                    userId={user.id}
                    priceId={foundingAvailable ? STRIPE_PRICES.foundingAnnual : STRIPE_PRICES.annual}
                    label={foundingAvailable ? 'Annual - $49/yr (save 18%)' : 'Annual - $99/yr (save 17%)'}
                    isFounding={foundingAvailable}
                    variant="ghost"
                  />
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-[#78716C]">
              Cancel anytime. Founding rates are locked in for life once claimed.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
