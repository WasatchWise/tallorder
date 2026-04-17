'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { generatePseudonyms, validatePseudonym } from '@/lib/constants/pseudonyms'
import { US_STATES, METROS_BY_STATE } from '@/lib/constants/locations'
import { RefreshCw, Check, Upload, X } from 'lucide-react'

const STEPS = ['Pseudonym', 'Location', 'About you', 'Photos']
const LOOKING_FOR_OPTIONS = [
  { value: 'dating', label: 'Dating' },
  { value: 'friends', label: 'Friends' },
  { value: 'activity_partners', label: 'Activity partners' },
  { value: 'open', label: 'Open to anything' },
]

const INTERESTED_IN_OPTIONS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'everyone', label: 'Everyone' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const supabase = createClient()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Step 0: Pseudonym
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [pseudonym, setPseudonym] = useState('')
  const [customMode, setCustomMode] = useState(false)
  const [pseudonymError, setPseudonymError] = useState('')

  // Step 1: Location
  const [city, setCity] = useState('')
  const [state, setState] = useState('')

  // Step 2: About
  const [bio, setBio] = useState('')
  const [dob, setDob] = useState('')
  const [lookingFor, setLookingFor] = useState<string[]>([])
  const [interestedIn, setInterestedIn] = useState('')

  // Step 3: Photos
  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setSuggestions(generatePseudonyms(3))
  }, [])

  function refreshSuggestions() {
    setSuggestions(generatePseudonyms(3))
    if (!customMode) setPseudonym('')
  }

  function selectSuggestion(name: string) {
    setPseudonym(name)
    setCustomMode(false)
    setPseudonymError('')
  }

  function toggleLookingFor(value: string) {
    setLookingFor(prev =>
      prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]
    )
  }

  function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    const remaining = 6 - photos.length
    const toAdd = files.slice(0, remaining).filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} is over 5MB. Please choose a smaller photo.`)
        return false
      }
      return true
    })
    setPhotos(prev => [...prev, ...toAdd])
    toAdd.forEach(file => {
      const url = URL.createObjectURL(file)
      setPreviews(prev => [...prev, url])
    })
  }

  function removePhoto(idx: number) {
    setPhotos(prev => prev.filter((_, i) => i !== idx))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[idx])
      return prev.filter((_, i) => i !== idx)
    })
  }

  async function checkPseudonymAvailable(name: string): Promise<boolean> {
    const { data } = await supabase
      .from('profiles')
      .select('pseudonym')
      .eq('pseudonym', name)
      .maybeSingle()
    return !data
  }

  async function nextStep() {
    setError('')

    if (step === 0) {
      const err = validatePseudonym(pseudonym)
      if (err) { setPseudonymError(err); return }
      const available = await checkPseudonymAvailable(pseudonym)
      if (!available) { setPseudonymError('That pseudonym is already taken. Try another?'); return }
    }

    if (step === 1) {
      if (!state) { setError('Please select your state.'); return }
      if (!city) { setError('Please select your metro area.'); return }
    }

    if (step === 2) {
      if (!dob) { setError('Date of birth is required.'); return }
      const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      if (age < 18) { setError('You must be 18 or older to use Tall Order.'); return }
      if (lookingFor.length === 0) { setError('Select at least one option.'); return }
    }

    if (step === 3) {
      if (photos.length === 0) { setError('At least one photo is required.'); return }
      await submitProfile()
      return
    }

    setStep(s => s + 1)
  }

  async function submitProfile() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      // Create profile
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        pseudonym,
        height_ft: user.user_metadata.height_ft ?? 6,
        height_in: user.user_metadata.height_in ?? 0,
        gender: user.user_metadata.gender ?? 'prefer_not',
        city: city.trim(),
        state: state.trim() || null,
        date_of_birth: dob,
        bio: bio.trim() || null,
        looking_for: lookingFor,
        interested_in: interestedIn || null,
      })

      if (profileError) {
        setError(profileError.message)
        setLoading(false)
        return
      }

      // Grant initial tokens via server route (handles founding 500 check)
      await fetch('/api/onboarding/grant-tokens', { method: 'POST' })

      // Upload photos
      for (let i = 0; i < photos.length; i++) {
        const file = photos[i]
        const ext = file.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${i}.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('tall-order-photos')
          .upload(path, file, { contentType: file.type })

        if (!uploadError) {
          await supabase.from('photos').insert({
            user_id: user.id,
            storage_path: path,
            blur_level_default: 3,
            is_primary: i === 0,
            approved: false,
          })
        }
      }

      router.push('/subscription')
    } catch {
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  const heightDisplay = () => {
    const ft = 6, inches = 0
    return `${ft}'${inches}"`
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col">
      {/* Header */}
      <div className="bg-[#1C1917] h-14 flex items-center px-4">
        <span className="text-white font-bold text-lg">Ta<span className="text-[#D97706]">ll</span> Order</span>
      </div>

      {/* Progress */}
      <div className="bg-white border-b border-[#E7E5E4] px-4 py-3">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-2 mb-2">
            {STEPS.map((label, i) => (
              <div key={label} className="flex items-center gap-2 flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-all duration-150 ${
                  i < step ? 'bg-[#D97706] text-white' :
                  i === step ? 'bg-[#1C1917] text-white' :
                  'bg-[#E7E5E4] text-[#78716C]'
                }`}>
                  {i < step ? <Check className="w-3 h-3" /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 flex-1 transition-all duration-300 ${i < step ? 'bg-[#D97706]' : 'bg-[#E7E5E4]'}`} />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-[#78716C]">Step {step + 1} of {STEPS.length}: <span className="font-medium text-[#1C1917]">{STEPS[step]}</span></p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-start justify-center px-4 py-8">
        <div className="w-full max-w-lg">

          {/* Step 0: Pseudonym */}
          {step === 0 && (
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917] mb-1" style={{ letterSpacing: '-0.02em' }}>Choose your name</h1>
              <p className="text-[#78716C] text-sm mb-6">This is what others will see. No real names required.</p>

              <div className="space-y-3 mb-4">
                {suggestions.map(name => (
                  <button
                    key={name}
                    onClick={() => selectSuggestion(name)}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left cursor-pointer transition-all duration-150 ${
                      pseudonym === name && !customMode
                        ? 'border-[#D97706] bg-[#FEF3C7]'
                        : 'border-[#E7E5E4] bg-white hover:border-[#D97706]'
                    }`}
                  >
                    <span className="font-medium text-[#1C1917]">{name}</span>
                    {pseudonym === name && !customMode && <Check className="w-4 h-4 text-[#D97706]" />}
                  </button>
                ))}
              </div>

              <button
                onClick={refreshSuggestions}
                className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#1C1917] mb-6 cursor-pointer transition-colors duration-150"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Generate new suggestions
              </button>

              <div className="border-t border-[#E7E5E4] pt-5">
                <p className="text-xs font-medium text-[#1C1917] mb-2">Or create your own</p>
                <input
                  type="text"
                  placeholder="3-20 characters"
                  value={customMode ? pseudonym : ''}
                  onChange={e => {
                    setCustomMode(true)
                    setPseudonym(e.target.value)
                    setPseudonymError('')
                  }}
                  maxLength={20}
                  className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150"
                />
                {pseudonymError && <p className="text-[#DC2626] text-xs mt-1.5">{pseudonymError}</p>}
              </div>
            </div>
          )}

          {/* Step 1: Location */}
          {step === 1 && (
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917] mb-1" style={{ letterSpacing: '-0.02em' }}>Where are you based?</h1>
              <p className="text-[#78716C] text-sm mb-6">We use this to show you people nearby. We never share your exact location.</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">State</label>
                  <select
                    value={state}
                    onChange={e => { setState(e.target.value); setCity('') }}
                    className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 bg-white cursor-pointer"
                  >
                    <option value="">Select your state</option>
                    {US_STATES.map(s => (
                      <option key={s.abbr} value={s.abbr}>{s.name}</option>
                    ))}
                  </select>
                </div>
                {state && (
                  <div>
                    <label className="block text-xs font-medium text-[#1C1917] mb-1.5">Metro area</label>
                    <select
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 bg-white cursor-pointer"
                    >
                      <option value="">Select your metro area</option>
                      {(METROS_BY_STATE[state] ?? []).map(metro => (
                        <option key={metro} value={metro}>{metro}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: About */}
          {step === 2 && (
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917] mb-1" style={{ letterSpacing: '-0.02em' }}>Tell people about yourself</h1>
              <p className="text-[#78716C] text-sm mb-6">Keep it real. This is what people read before they decide to connect.</p>
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">Date of birth <span className="text-[#78716C] font-normal">(you must be 18+)</span></label>
                  <input
                    type="date"
                    value={dob}
                    onChange={e => { setDob(e.target.value); setError('') }}
                    max={new Date(Date.now() - 18 * 365.25 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                    className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
                    Bio <span className="text-[#78716C] font-normal">({bio.length}/500)</span>
                  </label>
                  <textarea
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                    maxLength={500}
                    rows={4}
                    placeholder="What do you want people to know? What are you into? What's the best thing about being tall?"
                    className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 resize-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-2">
                    Interested in <span className="text-[#78716C] font-normal">(optional)</span>
                  </label>
                  <div className="flex gap-2">
                    {INTERESTED_IN_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setInterestedIn(v => v === opt.value ? '' : opt.value)}
                        className={`flex-1 px-3 py-3 rounded-lg border text-sm font-medium cursor-pointer transition-all duration-150 ${
                          interestedIn === opt.value
                            ? 'border-[#D97706] bg-[#FEF3C7] text-[#1C1917]'
                            : 'border-[#E7E5E4] bg-white text-[#78716C] hover:border-[#D97706]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1C1917] mb-2">I'm looking for</label>
                  <div className="grid grid-cols-2 gap-2">
                    {LOOKING_FOR_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => toggleLookingFor(opt.value)}
                        className={`px-4 py-3 rounded-lg border text-sm font-medium text-left cursor-pointer transition-all duration-150 ${
                          lookingFor.includes(opt.value)
                            ? 'border-[#D97706] bg-[#FEF3C7] text-[#1C1917]'
                            : 'border-[#E7E5E4] bg-white text-[#78716C] hover:border-[#D97706]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Photos */}
          {step === 3 && (
            <div>
              <h1 className="text-2xl font-bold text-[#1C1917] mb-1" style={{ letterSpacing: '-0.02em' }}>Add your photos</h1>
              <p className="text-[#78716C] text-sm mb-2">Photos are blurred by default. You control who sees the real you.</p>
              <div className="flex items-center gap-2 mb-6 p-3 bg-[#FEF3C7] rounded-lg">
                <span className="text-[#D97706] text-sm">&#8505;</span>
                <p className="text-xs text-[#78716C]">All photos are reviewed before going live. Usually within a few hours.</p>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                {previews.map((src, i) => (
                  <div key={i} className="aspect-square rounded-xl overflow-hidden relative bg-stone-100">
                    <img src={src} alt="" className="w-full h-full object-cover" style={{ filter: 'blur(8px)', transform: 'scale(1.1)' }} />
                    <button
                      onClick={() => removePhoto(i)}
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#1C1917]/80 flex items-center justify-center cursor-pointer"
                    >
                      <X className="w-3 h-3 text-white" />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1.5 left-1.5 text-xs bg-[#D97706] text-white px-1.5 py-0.5 rounded font-medium">Primary</span>
                    )}
                  </div>
                ))}

                {photos.length < 6 && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-[#D6D3D1] flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#D97706] transition-colors duration-150"
                  >
                    <Upload className="w-5 h-5 text-[#78716C]" />
                    <span className="text-xs text-[#78716C]">Add photo</span>
                  </button>
                )}
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/heic"
                multiple
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <p className="text-xs text-[#78716C]">Up to 6 photos. 5MB max per photo. JPG, PNG, WebP, or HEIC.</p>
            </div>
          )}

          {/* Error */}
          {error && <p className="text-[#DC2626] text-sm mt-4 p-3 bg-red-50 rounded-lg">{error}</p>}

          {/* Navigation */}
          <div className="flex gap-3 mt-8">
            {step > 0 && (
              <button
                onClick={() => { setStep(s => s - 1); setError('') }}
                className="flex-1 border border-[#D6D3D1] text-[#1C1917] font-semibold py-3 rounded-lg text-sm hover:bg-[#F5F5F4] transition-all duration-150 cursor-pointer"
              >
                Back
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={loading || (step === 0 && !pseudonym)}
              className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg text-sm transition-all duration-150 cursor-pointer disabled:opacity-50 active:scale-[0.98]"
            >
              {loading ? 'Setting up your profile...' : step === 3 ? 'Finish' : 'Continue'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
