import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Check, Star } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { FOUNDING_MEMBER_LIMIT } from '@/lib/constants/stripe'

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

export default async function PricingPage() {
  const supabase = await createClient()

  const { count: foundingCount } = await supabase
    .from('subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('is_founding_member', true)

  const foundingRemaining = FOUNDING_MEMBER_LIMIT - (foundingCount ?? 0)
  const foundingAvailable = foundingRemaining > 0

  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Nav */}
      <nav className="bg-[#1C1917] h-14 md:h-16 flex items-center px-4 md:px-6">
        <div className="max-w-[1152px] mx-auto w-full flex items-center justify-between">
          <Link href="/">
            <Image
              src="/images/logo-dark.png"
              alt="Tall Order"
              width={200}
              height={54}
              className="h-10 md:h-12 w-auto"
              priority
            />
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-[#F5F5F4] text-sm font-medium hover:text-[#D97706] transition-colors duration-150">
              Sign in
            </Link>
            <Link href="/signup" className="text-sm font-semibold text-[#1C1917] bg-[#D97706] hover:bg-[#B45309] px-4 py-2 rounded-lg transition-colors duration-150">
              Join free
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="bg-[#1C1917] px-4 py-16 md:py-20 text-center">
        <div className="max-w-[640px] mx-auto">
          <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-4">Pricing</p>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight" style={{ letterSpacing: '-0.025em' }}>
            Simple, transparent pricing
          </h1>
          <p className="text-[#A8A29E] text-lg max-w-md mx-auto">
            Free to browse. Upgrade when you&apos;re ready to connect.
          </p>
          {foundingAvailable && (
            <div className="mt-6 inline-flex items-center gap-1.5 bg-stone-800 border border-stone-600 text-[#D97706] text-sm font-semibold px-4 py-2 rounded-full">
              <Star className="w-4 h-4" />
              {foundingRemaining >= 490
                ? 'Limited founding spots — rate locked forever at $4.99/mo'
                : `${foundingRemaining} founding spots left — rate locked forever at $4.99/mo`}
            </div>
          )}
        </div>
      </section>

      {/* Pricing cards */}
      <section className="px-4 py-16 md:py-20">
        <div className="max-w-[720px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Free */}
            <div className="bg-white border border-[#E7E5E4] rounded-2xl p-6">
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wider mb-2">Free</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-[#1C1917]">$0</span>
                <span className="text-sm text-[#78716C]">/mo</span>
              </div>
              <p className="text-sm text-[#78716C] mb-6">No credit card required.</p>
              <ul className="space-y-3 mb-8">
                {FEATURES_FREE.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-[#44403C]">
                    <Check className="w-4 h-4 text-[#78716C] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/signup"
                className="block w-full text-center border border-[#D6D3D1] text-[#1C1917] font-semibold py-3 rounded-lg hover:border-[#A8A29E] transition-colors duration-150 text-sm"
              >
                Get started free
              </Link>
            </div>

            {/* Full access */}
            <div className="bg-[#1C1917] rounded-2xl p-6 relative overflow-hidden">
              {foundingAvailable && (
                <div className="absolute top-4 right-4 flex items-center gap-1 bg-[#D97706] text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  <Star className="w-3 h-3" /> Founding
                </div>
              )}
              <p className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2">Full Access</p>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-white">
                  {foundingAvailable ? '$4.99' : '$9.99'}
                </span>
                <span className="text-sm text-stone-400">/mo</span>
              </div>
              {foundingAvailable ? (
                <p className="text-sm text-stone-400 mb-6">
                  <span className="line-through">$9.99/mo</span> — founding rate locked forever
                </p>
              ) : (
                <p className="text-sm text-stone-400 mb-6">Billed monthly. Cancel anytime.</p>
              )}
              <ul className="space-y-3 mb-8">
                {FEATURES_PAID.map(f => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-stone-300">
                    <Check className="w-4 h-4 text-[#D97706] shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/login?next=/subscription"
                className="flex items-center justify-center gap-2 w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg transition-colors duration-150 text-sm"
              >
                {foundingAvailable ? 'Claim founding rate' : 'Get full access'} <ArrowRight className="w-4 h-4" />
              </Link>
              {foundingAvailable && (
                <p className="text-center text-xs text-stone-500 mt-3">
                  Also available: Annual plan at $49/yr (save 18%)
                </p>
              )}
            </div>
          </div>

          <p className="text-center text-sm text-[#78716C]">
            Cancel anytime.{foundingAvailable ? ' Founding rates are locked in for life once claimed.' : ''}
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-12 md:py-16 border-t border-[#E7E5E4]">
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-xl font-bold text-[#1C1917] mb-8 text-center" style={{ letterSpacing: '-0.02em' }}>
            Common questions
          </h2>
          <div className="space-y-6">
            <div>
              <p className="text-sm font-semibold text-[#1C1917] mb-1">What&apos;s included in free?</p>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Free members can create a profile, browse people in their city, view events, and receive connection requests from full-access members.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1C1917] mb-1">What is a Founding Member?</p>
              <p className="text-sm text-[#78716C] leading-relaxed">
                The first 500 subscribers lock in $4.99/mo forever — even after the regular price becomes $9.99. That rate never goes up as long as you stay subscribed.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1C1917] mb-1">Can I cancel anytime?</p>
              <p className="text-sm text-[#78716C] leading-relaxed">
                Yes. Cancel anytime from your settings. If you&apos;re a founding member, your rate is re-locked if you resubscribe within 30 days.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1C1917] mb-1">How does height verification work?</p>
              <p className="text-sm text-[#78716C] leading-relaxed">
                We use a minimum height requirement at signup — 6&apos;2&quot; for men, 5&apos;10&quot; for women and non-binary members. Community members may report profiles that misrepresent height.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C1917] border-t border-stone-800 px-4 py-8">
        <div className="max-w-[1152px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-stone-500 text-sm">
          <span>Tall Order by Wasatch Wise LLC</span>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
            <Link href="/community-guidelines" className="hover:text-stone-300 transition-colors">Community Guidelines</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
