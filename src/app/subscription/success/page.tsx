import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { Check } from 'lucide-react'

export default async function SubscriptionSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  // Webhook will have already updated subscriptions; optional: fetch session from Stripe to show plan details
  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status, is_founding_member, current_period_end')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPaid = (sub?.tier === 'paid' && sub?.status === 'active')
    || profile.subscription_tier === 'paid'
    || profile.subscription_tier === 'founding'

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[480px] mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-5">
          <Check className="w-8 h-8 text-[#D97706]" />
        </div>
        <h1 className="text-2xl font-bold text-[#1C1917] mb-2">You're in</h1>
        <p className="text-[#78716C] mb-6">
          {isPaid
            ? "Your subscription is active. You can send connection requests and message your connections."
            : "Your payment is being processed. If you don't see full access in a moment, refresh the page."}
        </p>
        {sub?.is_founding_member && (
          <p className="text-sm text-[#D97706] font-medium mb-6">Founding member rate locked forever</p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/browse"
            className="inline-flex items-center justify-center bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-all duration-150"
          >
            Browse
          </Link>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center border border-[#E7E5E4] bg-white text-[#1C1917] font-semibold px-6 py-3 rounded-xl text-sm hover:bg-[#F5F5F4] transition-all duration-150"
          >
            Settings
          </Link>
        </div>
      </div>
    </div>
  )
}
