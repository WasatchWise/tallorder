import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        <Link href="/settings" className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>

        <h1 className="text-2xl font-bold text-[#1C1917] mb-2" style={{ letterSpacing: '-0.02em' }}>Terms of Service</h1>
        <p className="text-sm text-[#78716C] mb-8">Last updated: March 2026</p>

        <div className="space-y-6 text-[#1C1917]">
          <section>
            <h2 className="text-base font-semibold mb-2">1. Eligibility</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              You must be 18 years or older to use Tall Order. By creating an account, you confirm that you meet this age requirement. We reserve the right to terminate accounts where we have reason to believe the member is under 18.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. Your account</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              You are responsible for maintaining the security of your account credentials. You agree to provide accurate information, including your actual height, and not to impersonate another person. One account per person.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. Acceptable use</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              You agree not to harass, threaten, or harm other members. You agree not to upload photos that are not of yourself, that are sexually explicit, or that depict illegal activity. You agree not to use the platform to solicit commercial transactions or to impersonate others. Violations may result in immediate account termination.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. Subscriptions and payments</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Paid subscriptions are billed monthly or annually as selected. Subscriptions renew automatically until cancelled. Founding member rates are locked in for the life of your subscription as long as you maintain continuous payment. Refunds are not provided for partial billing periods.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. Content</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              You retain ownership of content you upload. By uploading content, you grant Tall Order a limited license to display that content to other members of the platform as described in our Privacy Policy. We may remove content that violates our community guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. Limitation of liability</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Tall Order is a platform connecting people. We are not responsible for the actions of members or for outcomes of real-world meetings. Always meet in public places. Trust your instincts. Our liability is limited to the amount you paid us in the prior 3 months.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. Termination</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              We may terminate or suspend your account for violations of these terms at our discretion. You may delete your account at any time from your profile settings.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">8. Contact</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Questions about these terms? Email admin@wasatchwise.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
