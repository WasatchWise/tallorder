import Link from 'next/link'
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react'

const DO = [
  'Be honest about who you are. Use real photos of yourself.',
  'Be respectful. Treat other members the way you want to be treated.',
  'Communicate clearly. If you are not interested, say so kindly.',
  'Meet in public for first meetings.',
  'Report accounts that seem fake or make you feel unsafe.',
]

const DONT = [
  'Send explicit, unsolicited photos or messages.',
  'Harass, threaten, or pressure anyone.',
  'Use fake photos or pretend to be someone else.',
  'Solicit money or promote commercial services.',
  'Share personal information about other members outside the platform.',
  'Create multiple accounts or share your account with others.',
]

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <div className="max-w-[680px] mx-auto px-4 py-8">
        <Link href="/settings" className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Settings
        </Link>

        <h1 className="text-2xl font-bold text-[#1C1917] mb-2" style={{ letterSpacing: '-0.02em' }}>Community Guidelines</h1>
        <p className="text-sm text-[#78716C] mb-8">Last updated: March 2026</p>

        <p className="text-sm text-[#44403C] leading-relaxed mb-8">
          Tall Order is built on the premise that real people deserve a respectful, safe space to meet. These guidelines exist to protect that. Violations may result in warnings, temporary suspension, or permanent removal.
        </p>

        <div className="space-y-6">
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-4 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Do
            </h2>
            <ul className="space-y-3">
              {DO.map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <CheckCircle className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-[#44403C] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-4 flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              Don't
            </h2>
            <ul className="space-y-3">
              {DONT.map(item => (
                <li key={item} className="flex items-start gap-2.5">
                  <XCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-[#44403C] leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-2">Safety tips</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Always meet in a public place for a first meeting. Tell someone you trust where you are going. Trust your instincts. If something feels off, it probably is. Use the block and report tools freely. We review every report.
            </p>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-2">Enforcement</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Reports are reviewed by our team within 48 hours. Accounts found in violation may be warned, suspended, or permanently removed depending on severity. We err on the side of safety.
            </p>
          </div>

          <div className="bg-white border border-[#E7E5E4] rounded-xl p-5">
            <h2 className="text-sm font-semibold text-[#1C1917] mb-2">Questions</h2>
            <p className="text-sm text-[#44403C] leading-relaxed">
              Email admin@wasatchwise.com.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
