'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Header from '@/components/layout/Header'
import { createClient } from '@/lib/supabase/client'
import { CheckCircle2, Clock, Loader2, Upload, X, ShieldCheck } from 'lucide-react'

type VerifyStatus = 'loading' | 'not_paid' | 'already_verified' | 'pending' | 'rejected' | 'eligible'

export default function VerifyPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const [pageState, setPageState] = useState<VerifyStatus>('loading')
  const [profile, setProfile] = useState<Record<string, any> | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      const { data: p } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle()

      if (!p) { router.replace('/onboarding'); return }
      setProfile(p)

      // Not a paid subscriber
      if (p.subscription_tier !== 'paid' && p.subscription_tier !== 'founding') {
        setPageState('not_paid')
        return
      }

      // Already verified
      if (p.is_verified) {
        setPageState('already_verified')
        return
      }

      // Check for existing submission
      const { data: sub } = await supabase
        .from('verification_submissions')
        .select('status')
        .eq('user_id', user.id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (sub?.status === 'pending') {
        setPageState('pending')
      } else if (sub?.status === 'rejected') {
        setPageState('rejected')
      } else {
        setPageState('eligible')
      }
    }
    load()
  }, [])

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhoto(file)
    if (preview) URL.revokeObjectURL(preview)
    setPreview(URL.createObjectURL(file))
  }

  function removePhoto() {
    setPhoto(null)
    if (preview) { URL.revokeObjectURL(preview); setPreview(null) }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!photo || !profile) return
    setSubmitting(true)
    setError('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setSubmitting(false); return }

    // Upload photo to verification/ prefix
    const ext = photo.name.split('.').pop()
    const path = `${user.id}/verification/${Date.now()}.${ext}`

    const { error: uploadErr } = await supabase.storage
      .from('tall-order-photos')
      .upload(path, photo, { contentType: photo.type })

    if (uploadErr) {
      setError('Photo upload failed. Please try again.')
      setSubmitting(false)
      return
    }

    // Insert submission record
    const { error: insertErr } = await supabase
      .from('verification_submissions')
      .insert({ user_id: user.id, photo_path: path })

    if (insertErr) {
      setError('Submission failed. Please try again.')
      setSubmitting(false)
      return
    }

    // Audit log
    void supabase.from('audit_log').insert({
      user_id: user.id,
      action: 'verification_submitted',
      metadata: { photo_path: path },
    })

    setDone(true)
    setSubmitting(false)
  }

  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#D97706] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <Header user={profile} />
      <div className="max-w-[540px] mx-auto px-4 py-8">

        {/* Not paid */}
        {pageState === 'not_paid' && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
            <ShieldCheck className="w-10 h-10 text-[#D6D3D1] mx-auto mb-3" />
            <h1 className="text-lg font-bold text-[#1C1917] mb-2">Verification is a subscriber benefit</h1>
            <p className="text-sm text-[#78716C] mb-6">
              The Height Verified badge is available to Full Access members. Upgrade to submit your verification.
            </p>
            <a
              href="/subscription"
              className="inline-flex items-center justify-center bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors duration-150"
            >
              See plans
            </a>
          </div>
        )}

        {/* Already verified */}
        {pageState === 'already_verified' && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
            <CheckCircle2 className="w-10 h-10 text-[#16A34A] mx-auto mb-3" />
            <h1 className="text-lg font-bold text-[#1C1917] mb-2">You're verified</h1>
            <p className="text-sm text-[#78716C]">
              Your profile shows the Height Verified badge. Thanks for being part of a trusted community.
            </p>
          </div>
        )}

        {/* Pending review */}
        {pageState === 'pending' && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
            <Clock className="w-10 h-10 text-[#D97706] mx-auto mb-3" />
            <h1 className="text-lg font-bold text-[#1C1917] mb-2">Under review</h1>
            <p className="text-sm text-[#78716C]">
              Your verification photo has been submitted. We review submissions within a few hours. You will get the badge once approved.
            </p>
          </div>
        )}

        {/* Rejected, can resubmit */}
        {pageState === 'rejected' && !done && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            Your previous submission was not approved. Please resubmit with a clear photo showing your full height next to a measuring reference.
          </div>
        )}

        {/* Success */}
        {done && (
          <div className="bg-white border border-[#E7E5E4] rounded-xl p-6 text-center">
            <Clock className="w-10 h-10 text-[#D97706] mx-auto mb-3" />
            <h1 className="text-lg font-bold text-[#1C1917] mb-2">Submitted - we will take a look</h1>
            <p className="text-sm text-[#78716C]">
              Usually reviewed within a few hours. Your badge will appear on your profile once approved.
            </p>
          </div>
        )}

        {/* Submission form (eligible or resubmitting after rejection) */}
        {(pageState === 'eligible' || pageState === 'rejected') && !done && (
          <>
            <div className="mb-6">
              <h1 className="text-xl font-bold text-[#1C1917] mb-1">Get verified</h1>
              <p className="text-sm text-[#78716C]">
                Show us it is you. Stand next to something that proves your height. Doorframe, tape measure, whatever is undeniable. We need to see your face in the shot.
              </p>
            </div>

            {/* What to show */}
            <div className="bg-[#FEF3C7] border border-amber-200 rounded-xl p-4 mb-6 text-sm text-[#92400E] space-y-1.5">
              <p className="font-semibold text-[#78350F]">What makes a good verification photo:</p>
              <p>Stand next to a doorframe, tape measure, or anything that proves your height.</p>
              <p>Your face must be visible. This proves you are real, not a catfish.</p>
              <p>No government ID, no last name, no personal info. Just you, standing tall, proving it.</p>
              <p>Photo must be taken by you. No screenshots.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Photo upload */}
              <div>
                {preview ? (
                  <div className="relative rounded-xl overflow-hidden bg-stone-100 aspect-[3/4] max-w-[240px]">
                    <img
                      src={preview}
                      alt="Verification photo preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={removePhoto}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-[#1C1917]/80 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#D6D3D1] rounded-xl py-10 flex flex-col items-center gap-2 hover:border-[#D97706] transition-colors duration-150 cursor-pointer"
                  >
                    <Upload className="w-6 h-6 text-[#78716C]" />
                    <span className="text-sm font-medium text-[#78716C]">Tap to upload photo</span>
                    <span className="text-xs text-[#A8A29E]">JPG, PNG, WebP or HEIC - 5MB max</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/heic"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

              {error && <p className="text-sm text-red-600 p-3 bg-red-50 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={!photo || submitting}
                className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors duration-150 text-sm"
              >
                {submitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                  <><ShieldCheck className="w-4 h-4" /> Submit for review</>
                )}
              </button>

              <p className="text-xs text-center text-[#A8A29E]">
                Verification photos are only seen by our moderation team and are never shown publicly.
              </p>
            </form>
          </>
        )}

      </div>
    </div>
  )
}
