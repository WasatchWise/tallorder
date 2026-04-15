'use client'

import { useState } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'

const GENDER_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'man', label: 'Men' },
  { value: 'woman', label: 'Women' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'prefer_not', label: 'Prefer not to say' },
]

const LOOKING_FOR_OPTIONS = [
  { value: 'dating', label: 'Dating' },
  { value: 'friends', label: 'Friends' },
  { value: 'activity_partners', label: 'Activity partners' },
  { value: 'open', label: 'Open to anything' },
]

const FAITH_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'christian', label: 'Christian' },
  { value: 'catholic', label: 'Catholic' },
  { value: 'jewish', label: 'Jewish' },
  { value: 'muslim', label: 'Muslim' },
  { value: 'hindu', label: 'Hindu' },
  { value: 'buddhist', label: 'Buddhist' },
  { value: 'spiritual', label: 'Spiritual' },
  { value: 'agnostic', label: 'Agnostic' },
  { value: 'atheist', label: 'Atheist' },
  { value: 'other', label: 'Other' },
]

const LIFESTYLE_TAG_OPTIONS = [
  'Dog person', 'Cat person', 'Outdoorsy', 'Night owl', 'Coffee snob',
  'Gym rat', 'Foodie', 'Remote worker', 'Musician', 'Travel lover',
  'Homebody', 'Early bird', 'Reader', 'Gamer', 'Artist',
]

const HEIGHT_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const totalIn = 48 + i // 4'0" to 7'11"
  const ft = Math.floor(totalIn / 12)
  const inches = totalIn % 12
  return { value: String(totalIn), label: `${ft}'${inches}"` }
})

export default function BrowseFilters({ activeCount }: { activeCount: number }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)

  const [minIn, setMinIn] = useState(searchParams.get('minIn') ?? '')
  const [maxIn, setMaxIn] = useState(searchParams.get('maxIn') ?? '')
  const [minAge, setMinAge] = useState(searchParams.get('minAge') ?? '')
  const [maxAge, setMaxAge] = useState(searchParams.get('maxAge') ?? '')
  const [gender, setGender] = useState(searchParams.get('gender') ?? '')
  const [lookingFor, setLookingFor] = useState<string[]>(
    searchParams.get('lookingFor') ? searchParams.get('lookingFor')!.split(',') : []
  )
  const [faith, setFaith] = useState(searchParams.get('faith') ?? '')
  const [lifestyleTags, setLifestyleTags] = useState<string[]>(
    searchParams.get('lifestyleTags') ? searchParams.get('lifestyleTags')!.split(',') : []
  )

  function toggleLookingFor(val: string) {
    setLookingFor(prev =>
      prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val]
    )
  }

  function toggleLifestyleTag(tag: string) {
    setLifestyleTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  function apply() {
    const params = new URLSearchParams()
    if (minIn) params.set('minIn', minIn)
    if (maxIn) params.set('maxIn', maxIn)
    if (minAge) params.set('minAge', minAge)
    if (maxAge) params.set('maxAge', maxAge)
    if (gender) params.set('gender', gender)
    if (lookingFor.length) params.set('lookingFor', lookingFor.join(','))
    if (faith) params.set('faith', faith)
    if (lifestyleTags.length) params.set('lifestyleTags', lifestyleTags.join(','))
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  function reset() {
    setMinIn(''); setMaxIn(''); setMinAge(''); setMaxAge(''); setGender(''); setLookingFor([]); setFaith(''); setLifestyleTags([])
    router.push(pathname)
    setOpen(false)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 border border-[#D6D3D1] bg-white rounded-lg px-3 py-2 text-sm font-medium text-[#1C1917] hover:bg-[#F5F5F4] transition-colors duration-150 cursor-pointer relative"
      >
        <SlidersHorizontal className="w-4 h-4" /> Filters
        {activeCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[#D97706] text-white text-[10px] font-bold flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="relative bg-white w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-bold text-[#1C1917]">Filters</h2>
              <button onClick={() => setOpen(false)} className="p-1 text-[#A8A29E] hover:text-[#1C1917] cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Height */}
              <div>
                <p className="text-xs font-medium text-[#1C1917] mb-2">Height range</p>
                <div className="flex items-center gap-3">
                  <select
                    value={minIn}
                    onChange={e => setMinIn(e.target.value)}
                    className="flex-1 border border-[#D6D3D1] rounded-lg px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white cursor-pointer"
                  >
                    <option value="">Min height</option>
                    {HEIGHT_OPTIONS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                  <span className="text-[#A8A29E] text-sm">to</span>
                  <select
                    value={maxIn}
                    onChange={e => setMaxIn(e.target.value)}
                    className="flex-1 border border-[#D6D3D1] rounded-lg px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] bg-white cursor-pointer"
                  >
                    <option value="">Max height</option>
                    {HEIGHT_OPTIONS.map(h => (
                      <option key={h.value} value={h.value}>{h.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Age */}
              <div>
                <p className="text-xs font-medium text-[#1C1917] mb-2">Age range</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={18} max={99}
                    placeholder="Min age"
                    value={minAge}
                    onChange={e => setMinAge(e.target.value)}
                    className="flex-1 border border-[#D6D3D1] rounded-lg px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                  <span className="text-[#A8A29E] text-sm">to</span>
                  <input
                    type="number"
                    min={18} max={99}
                    placeholder="Max age"
                    value={maxAge}
                    onChange={e => setMaxAge(e.target.value)}
                    className="flex-1 border border-[#D6D3D1] rounded-lg px-3 py-2.5 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706]"
                  />
                </div>
              </div>

              {/* Gender */}
              <div>
                <p className="text-xs font-medium text-[#1C1917] mb-2">Gender</p>
                <div className="flex flex-wrap gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-150 ${
                        gender === opt.value
                          ? 'border-[#D97706] bg-[#FEF3C7] text-[#1C1917]'
                          : 'border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Looking for */}
              <div>
                <p className="text-xs font-medium text-[#1C1917] mb-2">Looking for</p>
                <div className="flex flex-wrap gap-2">
                  {LOOKING_FOR_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => toggleLookingFor(opt.value)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-150 ${
                        lookingFor.includes(opt.value)
                          ? 'border-[#D97706] bg-[#FEF3C7] text-[#1C1917]'
                          : 'border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Faith */}
              <div>
                <p className="text-xs font-medium text-[#1C1917] mb-2">Faith</p>
                <div className="flex flex-wrap gap-2">
                  {FAITH_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFaith(opt.value)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-150 ${
                        faith === opt.value
                          ? 'border-[#D97706] bg-[#FEF3C7] text-[#1C1917]'
                          : 'border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lifestyle */}
              <div>
                <p className="text-xs font-medium text-[#1C1917] mb-2">Lifestyle</p>
                <div className="flex flex-wrap gap-2">
                  {LIFESTYLE_TAG_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleLifestyleTag(tag)}
                      className={`px-3 py-1.5 rounded-full border text-xs font-medium cursor-pointer transition-all duration-150 ${
                        lifestyleTags.includes(tag)
                          ? 'border-[#D97706] bg-[#FEF3C7] text-[#1C1917]'
                          : 'border-[#E7E5E4] text-[#78716C] hover:border-[#D97706]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button
                onClick={reset}
                className="flex-1 border border-[#D6D3D1] text-[#78716C] font-semibold py-3 rounded-xl text-sm hover:bg-[#F5F5F4] transition-all duration-150 cursor-pointer"
              >
                Reset
              </button>
              <button
                onClick={apply}
                className="flex-1 bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-xl text-sm transition-all duration-150 cursor-pointer"
              >
                Show results
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
