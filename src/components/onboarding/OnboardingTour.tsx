'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Compass, Eye, Coins, Shield, X, ChevronRight } from 'lucide-react'

const STEPS = [
  {
    icon: Compass,
    title: 'Browse profiles',
    body: 'Scroll through people in your city. Tap a card to see their full profile.',
  },
  {
    icon: Eye,
    title: 'Photos are blurred',
    body: 'Privacy first. Spend your cents (cm) to reveal someone\'s photos. They\'ll know you looked.',
  },
  {
    icon: Coins,
    title: 'Earn cm',
    body: 'You got 25 founding cm to start. Complete your profile, log in daily, and RSVP to events to earn more.',
  },
  {
    icon: Shield,
    title: 'Stay safe',
    body: 'See something off? Tap the "..." menu on any profile to report or block. We review reports within 48 hours.',
  },
]

export default function OnboardingTour({ userId }: { userId: string }) {
  const [step, setStep] = useState(0)
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  async function complete() {
    setDismissed(true)
    const supabase = createClient()
    await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('id', userId)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-xl overflow-hidden">
        {/* Header with dismiss */}
        <div className="flex items-center justify-between px-5 pt-4">
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-200 ${
                  i === step ? 'w-6 bg-[#D97706]' : i < step ? 'w-4 bg-amber-200' : 'w-4 bg-stone-200'
                }`}
              />
            ))}
          </div>
          <button
            onClick={complete}
            className="text-stone-400 hover:text-stone-600 p-1 -mr-1 cursor-pointer"
            aria-label="Skip tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-5 pt-5 pb-6 text-center">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-100 flex items-center justify-center mx-auto mb-4">
            <Icon className="w-6 h-6 text-[#D97706]" />
          </div>
          <h3 className="text-lg font-bold text-[#1C1917] mb-2">{current.title}</h3>
          <p className="text-sm text-[#78716C] leading-relaxed">{current.body}</p>
        </div>

        {/* Action */}
        <div className="px-5 pb-5">
          {isLast ? (
            <button
              onClick={complete}
              className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl transition-colors duration-150 cursor-pointer"
            >
              Start browsing
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={complete}
                className="flex-1 text-[#78716C] text-sm font-medium py-3 cursor-pointer"
              >
                Skip
              </button>
              <button
                onClick={() => setStep(step + 1)}
                className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl transition-colors duration-150 flex items-center justify-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
