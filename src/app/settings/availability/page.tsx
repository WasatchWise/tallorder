'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, Calendar, Lock, RefreshCw } from 'lucide-react'

// Build next 7 days starting from today
function getNextDays(count: number) {
  const days = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now)
    d.setDate(now.getDate() + i)
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
    days.push({
      label: dayNames[d.getDay()],
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      value: d.getDay(),
    })
  }
  return days
}

const DISPLAY_DAYS = getNextDays(7)

const TIME_BLOCKS = [
  { value: 'morning', label: 'Morning', sub: '6am-12pm' },
  { value: 'afternoon', label: 'Afternoon', sub: '12pm-6pm' },
  { value: 'evening', label: 'Evening', sub: '6pm-12am' },
]

type Block = { day_of_week: number; time_block: string }

function blockKey(b: Block) {
  return `${b.day_of_week}-${b.time_block}`
}

export default function AvailabilityPage() {
  const router = useRouter()

  const [loading, setLoading] = useState(true)
  const [active, setActive] = useState(false)
  const [activeUntil, setActiveUntil] = useState<string | null>(null)
  const [availableTokens, setAvailableTokens] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error' | 'activating' | 'renewing'>('idle')

  const loadStatus = useCallback(async () => {
    const res = await fetch('/api/calendar/status')
    if (res.status === 401) { router.replace('/login'); return }
    const data = await res.json()
    setActive(data.active)
    setActiveUntil(data.active_until)
    setAvailableTokens(data.available_tokens)
    setSelected(new Set((data.blocks as Block[]).map(blockKey)))
    setLoading(false)
  }, [router])

  useEffect(() => { loadStatus() }, [loadStatus])

  function toggleBlock(day: number, block: string) {
    const key = blockKey({ day_of_week: day, time_block: block })
    setSelected(prev => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })
  }

  async function handleActivate() {
    setStatus('activating')
    const res = await fetch('/api/calendar/activate', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) {
      setStatus('error')
      return
    }
    setActive(true)
    setActiveUntil(data.active_until)
    setAvailableTokens(v => v - data.cost)
    setStatus('idle')
  }

  async function handleSave() {
    setStatus('saving')
    const blocks: Block[] = [...selected].map(key => {
      const [day, block] = key.split('-')
      return { day_of_week: Number(day), time_block: block }
    })
    const res = await fetch('/api/calendar/availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocks }),
    })
    setStatus(res.ok ? 'saved' : 'error')
    if (res.ok) setTimeout(() => setStatus('idle'), 2500)
  }

  async function handleRenew() {
    setStatus('renewing')
    const res = await fetch('/api/calendar/renew', { method: 'POST' })
    const data = await res.json()
    if (!res.ok) { setStatus('error'); return }
    setActiveUntil(data.active_until)
    setAvailableTokens(v => v - data.cost)
    setStatus('idle')
  }

  const daysUntilExpiry = activeUntil
    ? Math.ceil((new Date(activeUntil).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null

  const expiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 3

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F4] flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-[#D97706] animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F5F5F4]">
      <div className="max-w-[540px] mx-auto px-4 py-8">
        <Link
          href="/settings"
          className="flex items-center gap-1.5 text-sm text-[#78716C] hover:text-[#1C1917] mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Settings
        </Link>

        <h1 className="text-xl font-bold text-[#1C1917] mb-1">Availability Calendar</h1>
        <p className="text-sm text-[#78716C] mb-6">
          Your schedule is never visible to anyone. Only mutual overlapping windows are surfaced to both of you, simultaneously.
        </p>

        {!active ? (
          /* ---- Inactive state ---- */
          <div className="space-y-4">
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#D97706]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">Private matching engine</p>
                  <p className="text-xs text-[#78716C]">14-day window, auto-expires</p>
                </div>
              </div>
              <ul className="space-y-2 mb-6 text-sm text-[#44403C]">
                <li className="flex items-start gap-2">
                  <span className="text-[#D97706] mt-0.5 shrink-0">&#10003;</span>
                  Mark when you're free (morning, afternoon, evening)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D97706] mt-0.5 shrink-0">&#10003;</span>
                  System finds windows where you and a connection are both free
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#D97706] mt-0.5 shrink-0">&#10003;</span>
                  Both of you are notified at the same time. Neither knows who triggered it
                </li>
                <li className="flex items-start gap-2">
                  <Lock className="w-3.5 h-3.5 text-[#78716C] mt-0.5 shrink-0" />
                  No one ever sees your raw schedule. Not even us.
                </li>
              </ul>

              <div className="border-t border-[#E7E5E4] pt-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1C1917]">5 cm to activate</p>
                  <p className="text-xs text-[#A8A29E]">You have {availableTokens} cm</p>
                </div>
                <button
                  onClick={handleActivate}
                  disabled={availableTokens < 5 || status === 'activating'}
                  className="flex items-center gap-2 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-50 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors duration-150"
                >
                  {status === 'activating' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Activating...</>
                  ) : 'Activate'}
                </button>
              </div>
              {availableTokens < 5 && (
                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mt-3">
                  You need {5 - availableTokens} more cm. You can earn cm by completing your profile or connecting with members.
                </p>
              )}
            </div>
          </div>
        ) : (
          /* ---- Active state: grid editor ---- */
          <div className="space-y-4">
            {/* Status bar */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl px-5 py-3.5 flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-[#16A34A] uppercase tracking-wider mb-0.5">Active</p>
                <p className="text-xs text-[#78716C]">
                  Expires {activeUntil ? new Date(activeUntil).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : ''}
                  {expiringSoon && <span className="text-amber-600 font-medium"> ({daysUntilExpiry}d left)</span>}
                </p>
              </div>
              {expiringSoon && (
                <button
                  onClick={handleRenew}
                  disabled={availableTokens < 3 || status === 'renewing'}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#D97706] hover:underline disabled:opacity-50"
                >
                  {status === 'renewing'
                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Renewing...</>
                    : <><RefreshCw className="w-3.5 h-3.5" /> Renew (3 cm)</>
                  }
                </button>
              )}
            </div>

            {/* Grid */}
            <div className="bg-white border border-[#E7E5E4] rounded-xl p-4">
              <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-4">
                Tap blocks when you're free
              </p>

              {/* Day headers */}
              <div className="grid grid-cols-8 gap-1 mb-1">
                <div /> {/* spacer for row labels */}
                {DISPLAY_DAYS.map((d, i) => (
                  <div key={i} className="text-center">
                    <span className="text-[10px] font-semibold text-[#78716C] uppercase tracking-wide block">{d.label}</span>
                    <span className="text-[9px] text-[#A8A29E]">{d.date}</span>
                  </div>
                ))}
              </div>

              {/* Rows */}
              {TIME_BLOCKS.map(block => (
                <div key={block.value} className="grid grid-cols-8 gap-1 mb-1">
                  {/* Row label */}
                  <div className="flex flex-col justify-center">
                    <span className="text-[10px] font-medium text-[#78716C] leading-tight">{block.label}</span>
                    <span className="text-[9px] text-[#A8A29E] leading-tight">{block.sub}</span>
                  </div>
                  {DISPLAY_DAYS.map((day, i) => {
                    const key = blockKey({ day_of_week: day.value, time_block: block.value })
                    const isOn = selected.has(key)
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => toggleBlock(day.value, block.value)}
                        className={`h-10 rounded-lg border transition-colors duration-100 ${
                          isOn
                            ? 'bg-[#D97706] border-[#D97706]'
                            : 'bg-[#F5F5F4] border-[#E7E5E4] hover:border-[#D97706]'
                        }`}
                        aria-label={`${isOn ? 'Deselect' : 'Select'} ${day.label} ${block.label}`}
                      />
                    )
                  })}
                </div>
              ))}

              <p className="text-xs text-[#A8A29E] mt-3">
                {selected.size === 0
                  ? 'No windows selected. Add some to get matched.'
                  : `${selected.size} window${selected.size !== 1 ? 's' : ''} selected`}
              </p>
            </div>

            {/* Save */}
            <button
              onClick={handleSave}
              disabled={status === 'saving'}
              className="w-full flex items-center justify-center gap-2 bg-[#D97706] hover:bg-[#B45309] disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors duration-150"
            >
              {status === 'saving' ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
              ) : status === 'saved' ? (
                'Saved! Matching in progress'
              ) : (
                'Save availability'
              )}
            </button>

            {status === 'error' && (
              <p className="text-sm text-red-600 text-center">Something went wrong. Try again.</p>
            )}

            <p className="text-xs text-[#A8A29E] text-center leading-relaxed">
              When you save, we check all your connections for overlapping windows.
              If there's a match, both of you get notified at the same time.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
