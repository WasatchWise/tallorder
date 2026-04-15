import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        <Link href="/settings" className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>

        <h1 className="text-2xl font-bold text-[#1C1917] mb-2" style={{ letterSpacing: '-0.02em' }}>Privacy Policy</h1>
        <p className="text-sm text-[#78716C] mb-8">Last updated: March 2026</p>

        <div className="prose prose-sm max-w-none space-y-6 text-[#1C1917]">
          <section>
            <h2 className="text-base font-semibold mb-2">1. What we collect</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              We collect the information you provide when creating an account: your email address, pseudonym, height, city, state, bio, and the photos you upload. We also collect usage data such as connection requests sent and received, messages exchanged with other members, and reports or blocks you initiate.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">2. How we use your information</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Your information is used to operate the Tall Order platform: to show your profile to other members in your city, to facilitate connections and messaging, and to keep our community safe. We do not sell your data to third parties. We do not use your data to train AI models.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">3. Photos and blur</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Photos you upload are stored securely and are blurred by default when shown to other members. Photos are only unblurred after a mutual connection accepts a reveal request. You control your blur settings and can remove photos at any time.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">4. Pseudonymity</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              We never display your real name to other members. Your pseudonym is chosen during onboarding and is your identity on the platform. Your email address is never visible to other members.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">5. Data retention</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              You may delete your account at any time from your profile settings. When you delete your account, your profile, photos, messages, and connection data are permanently removed. We retain anonymized audit records for safety and compliance purposes.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">6. Security</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              We use industry-standard encryption for data in transit and at rest. Access to your data is limited to the minimum necessary to operate the service. We log moderation actions in an audit trail to support safety investigations.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold mb-2">7. Contact</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Questions about your privacy? Email us at admin@wasatchwise.com. We respond within 5 business days.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
