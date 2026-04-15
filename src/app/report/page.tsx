'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { Flag, CheckCircle, Loader2 } from 'lucide-react'

const CATEGORIES = [
  { value: 'fake_profile', label: 'Fake profile', description: 'This person does not appear to be real.' },
  { value: 'harassment', label: 'Harassment', description: 'They sent threatening or abusive messages.' },
  { value: 'inappropriate_photos', label: 'Inappropriate photos', description: 'Their photos violate community guidelines.' },
  { value: 'dangerous_behavior', label: 'Dangerous behavior', description: 'They made me feel unsafe.' },
  { value: 'spam', label: 'Spam', description: 'Selling something, bot, or repeated unwanted contact.' },
  { value: 'other', label: 'Other', description: 'Something else not listed here.' },
]

function ReportForm() {
  const router = useRouter()
  const params = useSearchParams()
  const reportedId = params.get('id')
  const reportedPseudonym = params.get('pseudonym')
  const supabase = createClient()

  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')

  // Load current user's profile for header
  useState(() => {
    supabase.from('profiles').select('*').then(({ data }) => {
      if (data?.[0]) setProfile(data[0])
    })
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!reportedId || !category) return
    setStatus('submitting')

    const res = await fetch('/api/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reported_id: reportedId, category, description }),
    })

    if (res.ok) {
      setStatus('done')
    } else {
      setStatus('error')
    }
  }

  if (!reportedId) {
    return (
      <div className="max-w-[540px] mx-auto px-4 py-12 text-center">
        <p className="text-[#78716C]">No user specified. Go back and try again.</p>
      </div>
    )
  }

  return (
    <div className="max-w-[540px] mx-auto px-4 py-8">
      {status === 'done' ? (
        <div className="text-center py-12">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-[#1C1917] mb-2">Report submitted</h2>
          <p className="text-[#78716C] text-sm mb-6">
            We review every report. If this account violates our community guidelines, we will take action.
          </p>
          <button
            onClick={() => router.back()}
            className="text-sm font-semibold text-[#D97706] hover:underline"
          >
            Go back
          </button>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-6">
            <Flag className="w-5 h-5 text-red-500" />
            <h1 className="text-xl font-bold text-[#1C1917]">
              Report {reportedPseudonym ?? 'this user'}
            </h1>
          </div>

          <p className="text-sm text-[#78716C] mb-6">
            Reports are anonymous and reviewed by our team. Only submit a report if you believe
            this account is violating our community guidelines.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setCategory(cat.value)}
                  className={`w-full text-left p-4 rounded-xl border transition-colors duration-150 ${
                    category === cat.value
                      ? 'border-red-400 bg-red-50'
                      : 'border-[#E7E5E4] bg-white hover:border-[#D6D3D1]'
                  }`}
                >
                  <p className={`text-sm font-semibold ${category === cat.value ? 'text-red-700' : 'text-[#1C1917]'}`}>
                    {cat.label}
                  </p>
                  <p className="text-xs text-[#78716C] mt-0.5">{cat.description}</p>
                </button>
              ))}
            </div>

            {category && (
              <div>
                <label className="block text-xs text-[#78716C] mb-1.5">Additional details (optional)</label>
                <textarea
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full border border-[#D6D3D1] rounded-xl px-3 py-2 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none"
                  placeholder="Anything else we should know..."
                />
              </div>
            )}

            {status === 'error' && (
              <p className="text-sm text-red-600">Something went wrong. Please try again.</p>
            )}

            <button
              type="submit"
              disabled={!category || status === 'submitting'}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors duration-150"
            >
              {status === 'submitting' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
              ) : (
                'Submit report'
              )}
            </button>

            <button
              type="button"
              onClick={() => router.back()}
              className="w-full text-sm text-[#78716C] hover:text-[#1C1917] py-2 transition-colors"
            >
              Cancel
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Suspense>
        <ReportForm />
      </Suspense>
    </div>
  )
}
