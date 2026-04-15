import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Header from '@/components/layout/Header'
import { ChevronRight, CreditCard, Edit2, FileText, Shield, ShieldCheck, CheckCircle2, Clock, CalendarDays, Coins, MessageSquarePlus } from 'lucide-react'
import SignOutButton from './SignOutButton'
import ManageSubscriptionButton from './ManageSubscriptionButton'
import BlockedUsers from './BlockedUsers'
import InviteButton from '@/components/InviteButton'
import BuyTokensButton from './BuyTokensButton'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle()
  if (!profile) redirect('/onboarding')

  const { data: sub } = await supabase
    .from('subscriptions')
    .select('tier, status, is_founding_member, current_period_end, stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle()

  const isPaid = (sub?.tier === 'paid' && sub?.status === 'active') || profile.subscription_tier === 'paid' || profile.subscription_tier === 'founding'

  // Token balance
  const { data: tokenBal } = await supabase
    .from('token_balances')
    .select('balance, escrowed')
    .eq('user_id', user.id)
    .maybeSingle()
  const availableTokens = (tokenBal?.balance ?? 0) - (tokenBal?.escrowed ?? 0)

  // Blocked users
  const { data: blockedRows } = await supabase
    .from('blocks')
    .select('blocked_id, blocked:profiles!blocks_blocked_id_fkey(pseudonym)')
    .eq('blocker_id', user.id)
  const blockedUsers = (blockedRows ?? []).map((b: Record<string, unknown>) => ({
    blocked_id: b.blocked_id as string,
    pseudonym: (b.blocked as Record<string, unknown>)?.pseudonym as string ?? 'Unknown',
  }))

  // Verification status
  const { data: verSub } = isPaid ? await supabase
    .from('verification_submissions')
    .select('status')
    .eq('user_id', user.id)
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle() : { data: null }

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />

      <div className="max-w-[540px] mx-auto px-4 py-8 space-y-6">
        <h1 className="text-xl font-bold text-[#1C1917]">Settings</h1>

        {/* Account */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider px-5 pt-5 pb-3">Account</p>
          <Link
            href="/profile/edit"
            className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors border-t border-[#E7E5E4]"
          >
            <div className="flex items-center gap-3">
              <Edit2 className="w-4 h-4 text-[#78716C]" />
              <span className="text-sm text-[#1C1917]">Edit profile</span>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
          </Link>
          {isPaid && (
            <Link
              href="/settings/verify"
              className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors border-t border-[#E7E5E4]"
            >
              <div className="flex items-center gap-3">
                {profile.is_verified ? (
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                ) : verSub?.status === 'pending' ? (
                  <Clock className="w-4 h-4 text-[#D97706]" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-[#78716C]" />
                )}
                <div>
                  <p className="text-sm text-[#1C1917]">
                    {profile.is_verified ? 'Height Verified' : 'Get verified'}
                  </p>
                  {!profile.is_verified && verSub?.status === 'pending' && (
                    <p className="text-xs text-[#D97706]">Under review</p>
                  )}
                  {!profile.is_verified && !verSub && (
                    <p className="text-xs text-[#A8A29E]">Subscriber benefit</p>
                  )}
                </div>
              </div>
              {!profile.is_verified && <ChevronRight className="w-4 h-4 text-[#A8A29E]" />}
            </Link>
          )}
          <Link
            href="/settings/availability"
            className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors border-t border-[#E7E5E4]"
          >
            <div className="flex items-center gap-3">
              <CalendarDays className="w-4 h-4 text-[#78716C]" />
              <div>
                <p className="text-sm text-[#1C1917]">Availability Calendar</p>
                <p className="text-xs text-[#A8A29E]">Match on overlapping free windows</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
          </Link>
          <div className="px-5 py-3.5 border-t border-[#E7E5E4]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coins className="w-4 h-4 text-[#D97706]" />
                <div>
                  <p className="text-sm text-[#1C1917]">cm balance</p>
                  <p className="text-xs text-[#A8A29E]">{availableTokens} cm available</p>
                </div>
              </div>
              <BuyTokensButton />
            </div>
          </div>
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E7E5E4]">
            <div className="flex items-center gap-3">
              <Shield className="w-4 h-4 text-[#78716C]" />
              <div>
                <p className="text-sm text-[#1C1917]">Email</p>
                <p className="text-xs text-[#A8A29E]">{user.email}</p>
              </div>
            </div>
          </div>
          <InviteButton pseudonym={profile.pseudonym} />
        </div>

        {/* Subscription */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider px-5 pt-5 pb-3">Membership</p>
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#E7E5E4]">
            <div className="flex items-center gap-3">
              <CreditCard className="w-4 h-4 text-[#78716C]" />
              <div>
                <p className="text-sm text-[#1C1917]">
                  {isPaid ? 'Full access' : 'Free plan'}
                  {sub?.is_founding_member && (
                    <span className="ml-2 text-xs text-[#D97706] font-medium">Founding member</span>
                  )}
                </p>
                {isPaid && sub?.current_period_end && (
                  <p className="text-xs text-[#A8A29E]">
                    Renews {new Date(sub.current_period_end).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
            {!isPaid ? (
              <Link href="/subscription" className="text-xs font-semibold text-[#D97706] hover:underline">
                Upgrade
              </Link>
            ) : sub?.stripe_customer_id ? (
              <ManageSubscriptionButton />
            ) : (
              <span className="text-xs text-[#16A34A] font-medium">Active</span>
            )}
          </div>
        </div>

        {/* Legal */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider px-5 pt-5 pb-3">Legal</p>
          {[
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/terms', label: 'Terms of Service' },
            { href: '/community-guidelines', label: 'Community Guidelines' },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors border-t border-[#E7E5E4]"
            >
              <div className="flex items-center gap-3">
                <FileText className="w-4 h-4 text-[#78716C]" />
                <span className="text-sm text-[#1C1917]">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
            </Link>
          ))}
        </div>

        {/* Feedback */}
        <a
          href="mailto:admin@wasatchwise.com?subject=Tall Order Feedback"
          className="bg-white border border-[#E7E5E4] rounded-xl flex items-center justify-between px-5 py-3.5 hover:bg-stone-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquarePlus className="w-4 h-4 text-[#D97706]" />
            <div>
              <p className="text-sm text-[#1C1917]">Give feedback</p>
              <p className="text-xs text-[#A8A29E]">Feature requests, bugs, or just say hi</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#A8A29E]" />
        </a>

        {/* Blocked users */}
        <BlockedUsers initial={blockedUsers} />

        {/* Sign out + delete */}
        <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
          <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider px-5 pt-5 pb-3">Session</p>
          <div className="border-t border-[#E7E5E4] px-5 py-3.5">
            <SignOutButton />
          </div>
        </div>

        <div className="pt-2 pb-8">
          <Link
            href="/profile/edit#delete"
            className="text-sm text-red-500 hover:text-red-700 transition-colors"
          >
            Delete account
          </Link>
          <p className="text-xs text-[#A8A29E] mt-1">Permanently removes all your data. Cannot be undone.</p>
        </div>
      </div>
    </div>
  )
}
