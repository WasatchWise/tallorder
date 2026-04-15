'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const [checking, setChecking] = useState(true)

  const supabase = createClient()

  // After recovery link, auth/callback exchanges code and redirects here with session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setReady(!!session)
      setChecking(false)
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.updateUser({ password })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      router.push('/settings?reset=success')
      router.refresh()
    }
  }

  if (checking) {
    return (
      <div className="w-full max-w-sm text-center">
        <p className="text-[#78716C] text-sm">Loading...</p>
      </div>
    )
  }

  if (!ready) {
    return (
      <div className="w-full max-w-sm text-center">
        <h1 className="text-xl font-bold text-[#1C1917] mb-2">Invalid or expired link</h1>
        <p className="text-[#78716C] text-sm mb-6">
          Password reset links expire. Request a new one below.
        </p>
        <Link
          href="/forgot-password"
          className="inline-block bg-[#D97706] hover:bg-[#B45309] text-white font-semibold px-6 py-3 rounded-lg text-sm transition-all duration-150"
        >
          Send new reset link
        </Link>
        <p className="text-center text-sm text-[#78716C] mt-6">
          <Link href="/login" className="text-[#B45309] font-medium hover:underline">Back to sign in</Link>
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1C1917] mb-1">Set new password</h1>
        <p className="text-[#78716C] text-sm">Choose a password you'll remember.</p>
      </div>

      {error && (
        <p className="text-[#DC2626] text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#1C1917] mb-1.5">New password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="At least 6 characters"
            className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150"
          />
        </div>
        <div>
          <label htmlFor="confirm" className="block text-xs font-medium text-[#1C1917] mb-1.5">Confirm password</label>
          <input
            id="confirm"
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            required
            minLength={6}
            placeholder="Same as above"
            className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg transition-all duration-150 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
        >
          {loading ? 'Updating...' : 'Update password'}
        </button>
      </form>

      <p className="text-center text-sm text-[#78716C] mt-6">
        <Link href="/login" className="text-[#B45309] font-medium hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}
