import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Shield, Eye, Users, Calendar, Coins, Sparkles } from 'lucide-react'
import FoundingCounter from '@/components/FoundingCounter'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function LandingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('id').eq('id', user.id).maybeSingle()
    if (profile) redirect('/browse')
    else redirect('/onboarding')
  }
  return (
    <div className="min-h-screen bg-[#FAFAF9]">
      {/* Nav */}
      <nav className="bg-[#1C1917] h-14 md:h-16 flex items-center px-4 md:px-6">
        <div className="max-w-[1152px] mx-auto w-full flex items-center justify-between">
          <Image
            src="/images/logo-dark.png"
            alt="Tall Order"
            width={200}
            height={54}
            className="h-10 md:h-12 w-auto"
            priority
          />
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

      {/* Hero */}
      <section className="bg-[#1C1917] px-4 py-20 md:py-32 text-center">
        <div className="max-w-[896px] mx-auto">
          <Image
            src="/images/logo-dark.png"
            alt="Tall Order"
            width={400}
            height={108}
            className="h-16 md:h-20 w-auto mx-auto mb-8"
          />
          <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-4">For tall people. You know who you are.</p>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight" style={{ letterSpacing: '-0.025em' }}>
            Find People On Your Level
          </h1>
          <p className="text-[#A8A29E] text-lg md:text-xl max-w-xl mx-auto mb-10 leading-relaxed">
            Every dating app I tried was built for people who aren&apos;t like us. So I built one that is. No novelty. No explaining yourself. Just real connections with people who get it.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-150 text-base"
            >
              Create your profile <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center bg-transparent border border-stone-600 text-[#F5F5F4] hover:border-stone-400 font-semibold px-8 py-4 rounded-lg transition-colors duration-150 text-base"
            >
              Sign in
            </Link>
          </div>
          <p className="text-stone-500 text-sm mt-6">Free to browse. No credit card required.</p>

          {/* Founding 500 offer */}
          <div className="mt-8 inline-block bg-stone-800 border border-stone-600 rounded-xl px-6 py-4 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-widest text-[#D97706]">Founding Member Offer</span>
            </div>
            <p className="text-white text-sm mb-1">
              Lock in{' '}
              <span className="text-[#D97706] font-bold text-base">$4.99/mo</span>{' '}
              forever — regular price is $9.99
            </p>
            <p className="text-stone-400 text-xs">
              <FoundingCounter />
            </p>
          </div>
        </div>
      </section>

      {/* What it does - feature overview */}
      <section className="px-4 py-16 md:py-24 bg-[#FAFAF9]">
        <div className="max-w-[1152px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-3">What&apos;s live today</p>
            <h2 className="text-2xl md:text-3xl font-bold text-[#1C1917]" style={{ letterSpacing: '-0.02em' }}>
              Built different. From the ground up.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center mb-4">
                <Eye className="w-5 h-5 text-[#D97706]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C1917] mb-2">Privacy from the first hello</h3>
              <p className="text-[#78716C] text-sm leading-relaxed">
                Pseudonyms, not real names. Every photo starts blurred — five levels of privacy. You decide who sees you and when. Consent-driven, all the way down.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center mb-4">
                <Calendar className="w-5 h-5 text-[#D97706]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C1917] mb-2">Calendar matching</h3>
              <p className="text-[#78716C] text-sm leading-relaxed">
                Set when you&apos;re free. The app finds connections with overlapping availability and notifies you both. Nobody sees your schedule. Not even us.
              </p>
            </div>
            <div>
              <div className="w-10 h-10 rounded-lg bg-[#FEF3C7] flex items-center justify-center mb-4">
                <Users className="w-5 h-5 text-[#D97706]" />
              </div>
              <h3 className="text-lg font-semibold text-[#1C1917] mb-2">Built for the tall community</h3>
              <p className="text-[#78716C] text-sm leading-relaxed">
                Height is everything here. Tall people are the main event. If you&apos;re into tall people, you&apos;re welcome too — just be honest about your height. The community keeps it real.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Calendar deep-dive */}
      <section className="px-4 py-16 md:py-24 bg-white border-y border-[#E7E5E4]">
        <div className="max-w-[896px] mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-3">Private matching engine</p>
              <h2 className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-4" style={{ letterSpacing: '-0.02em' }}>
                The app does the awkward part
              </h2>
              <p className="text-[#78716C] leading-relaxed mb-6">
                Set morning, afternoon, or evening availability for the next two weeks. When two connected people have overlapping windows, both get notified. That&apos;s it.
              </p>
              <ul className="space-y-3">
                {[
                  "Neither person knows who activated the match",
                  "Nobody ever sees your raw schedule",
                  "Windows auto-expire after 14 days",
                  "No more \"when are you free\" back-and-forth",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-[#44403C]">
                    <span className="text-[#D97706] font-bold mt-0.5">—</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-[#F5F5F4] rounded-2xl p-6">
              <div className="space-y-3">
                {[
                  { label: "Morning", days: [true, false, true, false, true, false, false] },
                  { label: "Afternoon", days: [false, true, true, false, false, true, false] },
                  { label: "Evening", days: [true, true, false, true, false, false, true] },
                ].map(({ label, days }) => (
                  <div key={label} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-[#78716C] w-20 shrink-0">{label}</span>
                    <div className="flex gap-1.5">
                      {days.map((active, i) => (
                        <div
                          key={i}
                          className={`w-7 h-7 rounded-md text-xs flex items-center justify-center font-medium ${
                            active
                              ? 'bg-[#D97706] text-white'
                              : 'bg-[#E7E5E4] text-[#A8A29E]'
                          }`}
                        >
                          {['M', 'T', 'W', 'T', 'F', 'S', 'S'][i]}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="mt-4 pt-4 border-t border-[#E7E5E4]">
                  <p className="text-xs text-[#78716C]">Your schedule is never shared. The system only surfaces overlaps.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Profile card preview */}
      <section className="px-4 py-16 md:py-24 bg-[#F5F5F4]">
        <div className="max-w-[1152px] mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-3" style={{ letterSpacing: '-0.02em' }}>
              Browse. Take your time.
            </h2>
            <p className="text-[#78716C] max-w-lg mx-auto">
              Filter by city, height, age, what they&apos;re into. Real profiles from real people who chose to be here. Free to look around — no credit card, no commitment.
            </p>
          </div>

          {/* Mock profile cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 max-w-4xl mx-auto">
            {MOCK_PROFILES.map((profile) => (
              <MockProfileCard key={profile.pseudonym} profile={profile} />
            ))}
          </div>
        </div>
      </section>

      {/* Token / cm section */}
      <section className="px-4 py-16 md:py-24 bg-[#FAFAF9]">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-3">The token system</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-4" style={{ letterSpacing: '-0.02em' }}>
            We call them cm
          </h2>
          <p className="text-[#78716C] max-w-md mx-auto mb-8 leading-relaxed">
            Because everything here is measured in centimeters. Photo reveals, calendar activations, premium features. Spend a few cm to see who&apos;s worth your time.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { amount: "10 cm", price: "$2.99" },
              { amount: "25 cm", price: "$5.99" },
              { amount: "50 cm", price: "$9.99" },
            ].map(({ amount, price }) => (
              <div key={amount} className="bg-white border border-[#E7E5E4] rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-[#D97706] mb-1">{amount}</p>
                <p className="text-sm text-[#78716C]">{price}</p>
              </div>
            ))}
          </div>
          <p className="text-stone-400 text-xs mt-4">Subscribers get 10 cm refilled every week, free.</p>
        </div>
      </section>

      {/* Events */}
      <section className="px-4 py-16 md:py-24 bg-white border-y border-[#E7E5E4]">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-4">Events</p>
          <h2 className="text-2xl md:text-3xl font-bold text-[#1C1917] mb-3" style={{ letterSpacing: '-0.02em' }}>
            Plan the pre-game. Continue the after party.
          </h2>
          <p className="text-[#78716C] max-w-md mx-auto mb-6 leading-relaxed">
            Host meetups, happy hours, whatever. Earn tokens when people RSVP. See who&apos;s attending before you walk in. Missed a connection? Find them after you leave.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center text-left max-w-sm mx-auto">
            <div>
              <p className="text-sm font-semibold text-[#1C1917] mb-1">Before</p>
              <p className="text-sm text-[#78716C]">Browse the attendee list. Know who&apos;ll be there.</p>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1C1917] mb-1">After</p>
              <p className="text-sm text-[#78716C]">Reconnect with the people you met. No more lost connections.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Roadmap */}
      <section className="px-4 py-16 md:py-24 bg-[#1C1917]">
        <div className="max-w-[896px] mx-auto">
          <div className="text-center mb-12">
            <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-3">Where it&apos;s going</p>
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-3" style={{ letterSpacing: '-0.02em' }}>
              None of this exists anywhere else
            </h2>
            <p className="text-[#A8A29E] max-w-md mx-auto text-sm leading-relaxed">
              I looked. I&apos;m building it because nobody else will. The people who are here first get to shape what these look like.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {ROADMAP_ITEMS.map((item) => (
              <div key={item.title} className="bg-stone-800 border border-stone-700 rounded-xl p-5">
                <div className="flex items-start gap-3">
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div>
                    <h3 className="text-white font-semibold mb-1">{item.title}</h3>
                    <p className="text-stone-400 text-sm leading-relaxed">{item.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="px-4 py-16 md:py-24 bg-[#F5F5F4]">
        <div className="max-w-[640px] mx-auto text-center">
          <p className="text-[#D97706] text-sm font-semibold uppercase tracking-widest mb-4">Why this exists</p>
          <blockquote className="text-xl md:text-2xl font-bold text-[#1C1917] leading-snug mb-6" style={{ letterSpacing: '-0.02em' }}>
            &ldquo;I&apos;m 6&apos;5&ldquo;. Single. I built this for myself.&rdquo;
          </blockquote>
          <p className="text-[#78716C] leading-relaxed mb-4">
            I&apos;m not a professional developer. I&apos;m a solo founder who taught himself to code. No investors. No team. No corporate anything. Just me, building this one feature at a time.
          </p>
          <p className="text-[#78716C] leading-relaxed">
            Tell me what matters to you. I&apos;ll build it.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1C1917] px-4 py-16 md:py-24 text-center">
        <div className="max-w-[896px] mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-4" style={{ letterSpacing: '-0.02em' }}>
            You&apos;re not just signing up for an app.
          </h2>
          <p className="text-[#A8A29E] mb-8 max-w-sm mx-auto">
            You&apos;re getting in on the ground floor of something that&apos;s going to change how tall people connect. Free to browse. First 500 founding members lock in $4.99/mo forever.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-8 py-4 rounded-lg transition-colors duration-150 text-base"
          >
            Create your profile <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-stone-500 text-sm mt-4">No credit card to look around.</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#1C1917] border-t border-stone-800 px-4 py-8">
        <div className="max-w-[1152px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-stone-500 text-sm">
          <span>Tall Order by Wasatch Wise LLC</span>
          <div className="flex gap-6">
            <Link href="/pricing" className="hover:text-stone-300 transition-colors">Pricing</Link>
            <Link href="/privacy" className="hover:text-stone-300 transition-colors">Privacy</Link>
            <Link href="/terms" className="hover:text-stone-300 transition-colors">Terms</Link>
            <Link href="/community-guidelines" className="hover:text-stone-300 transition-colors">Community Guidelines</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

const MOCK_PROFILES = [
  { pseudonym: 'TallOak42', height: "6'4\"", age: 28, city: 'Denver', blur: 2 },
  { pseudonym: 'ElmStreet', height: "5'11\"", age: 31, city: 'Austin', blur: 3 },
  { pseudonym: 'CedarRidge', height: "6'6\"", age: 26, city: 'Portland', blur: 2 },
  { pseudonym: 'WillowCreek', height: "6'1\"", age: 34, city: 'Chicago', blur: 3 },
]

const ROADMAP_ITEMS = [
  {
    icon: "🤖",
    title: "AI Concierge",
    description: "An agent that learns your preferences and communication style. Helps you write better messages, suggests dates, remembers what you've told it. A personal wingman that gets smarter over time.",
  },
  {
    icon: "🔍",
    title: "Vibe Checks",
    description: "Before you ever talk to someone, your concierge talks to theirs. Two AIs assess compatibility based on what they know about each of you. If the vibe is there, you get introduced with a narrative about why you might click.",
  },
  {
    icon: "📋",
    title: "Planned Dates with Safety",
    description: "Emergency contacts, check-ins, location sharing (optional), SOS button. Date feedback after so the system learns what works for you.",
  },
  {
    icon: "⭐",
    title: "Accountability Scores",
    description: "Response rate, show-up rate, no-ghost track record. People who follow through get rewarded with token bonuses. People who don't start to fade from the queue.",
  },
  {
    icon: "🧠",
    title: "Neurodivergent Profiles",
    description: "Sensory needs, communication preferences, social needs. Not a checkbox. Real tools for people who experience the world differently.",
  },
  {
    icon: "🤝",
    title: "Friendship Mode",
    description: "Not everyone here is looking for a date. Some people just want to find their people. That's built in, not an afterthought.",
  },
]

function MockProfileCard({ profile }: { profile: typeof MOCK_PROFILES[0] }) {
  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
      {/* Blurred photo placeholder */}
      <div className="aspect-[3/4] bg-gradient-to-br from-stone-200 to-stone-300 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-stone-300 to-stone-400"
          style={{ filter: `blur(${profile.blur === 2 ? '12px' : '24px'})`, transform: 'scale(1.1)' }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-16 h-16 rounded-full bg-stone-300/50" />
        </div>
      </div>
      {/* Card info */}
      <div className="p-3">
        <div className="flex items-baseline justify-between mb-1">
          <span className="text-sm font-semibold text-[#1C1917] truncate">{profile.pseudonym}</span>
          <span className="text-sm font-medium text-[#D97706] ml-2 shrink-0" style={{ fontFamily: 'monospace' }}>{profile.height}</span>
        </div>
        <p className="text-xs text-[#78716C]">{profile.age} · {profile.city}</p>
      </div>
    </div>
  )
}
