'use client'

import { useState } from 'react'
import { Check, X, AlertTriangle, Loader2 } from 'lucide-react'

interface PhotoActionsProps {
  photoId: string
  onDone: (id: string) => void
}

export function PhotoActions({ photoId, onDone }: PhotoActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function act(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'photo', action, id: photoId }),
    })
    onDone(photoId)
    setLoading(null)
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => act('approve')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Approve
      </button>
      <button
        onClick={() => act('reject')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Reject
      </button>
    </div>
  )
}

interface VerifyActionsProps {
  submissionId: string
  onDone: (id: string) => void
}

export function VerifyActions({ submissionId, onDone }: VerifyActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function act(action: 'approve' | 'reject') {
    setLoading(action)
    await fetch('/api/admin/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: submissionId, action }),
    })
    onDone(submissionId)
    setLoading(null)
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => act('approve')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'approve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Approve
      </button>
      <button
        onClick={() => act('reject')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Reject
      </button>
    </div>
  )
}

interface ReportActionsProps {
  reportId: string
  onDone: (id: string) => void
}

export function ReportActions({ reportId, onDone }: ReportActionsProps) {
  const [loading, setLoading] = useState<string | null>(null)

  async function act(action: 'resolve' | 'escalate' | 'suspend') {
    if (action === 'suspend' && !confirm('Suspend this user? Their profile will be hidden and photos unapproved.')) return
    setLoading(action)
    await fetch('/api/admin/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'report', action, id: reportId }),
    })
    onDone(reportId)
    setLoading(null)
  }

  return (
    <div className="flex gap-2 mt-3">
      <button
        onClick={() => act('resolve')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-stone-600 hover:bg-stone-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'resolve' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
        Resolve
      </button>
      <button
        onClick={() => act('suspend')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'suspend' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
        Suspend
      </button>
      <button
        onClick={() => act('escalate')}
        disabled={!!loading}
        className="flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg disabled:opacity-50 transition-colors"
      >
        {loading === 'escalate' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <AlertTriangle className="w-3.5 h-3.5" />}
        Escalate
      </button>
    </div>
  )
}
