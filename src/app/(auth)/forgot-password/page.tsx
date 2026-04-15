'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: err } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })

    if (err) {
      setError(err.message)
      setLoading(false)
    } else {
      setSent(true)
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
          <span className="text-[#D97706] text-xl">&#10003;</span>
        </div>
        <h1 className="text-xl font-bold text-[#1C1917] mb-2">Check your email</h1>
        <p className="text-[#78716C] text-sm mb-6">
          We sent a password reset link to <strong>{email}</strong>. Click it to choose a new password.
        </p>
        <Link
          href="/login"
          className="text-[#B45309] font-semibold text-sm hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1C1917] mb-1">Reset password</h1>
        <p className="text-[#78716C] text-sm">Enter your email and we'll send you a link.</p>
      </div>

      {error && (
        <p className="text-[#DC2626] text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-xs font-medium text-[#1C1917] mb-1.5">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg transition-all duration-150 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
        >
          {loading ? 'Sending...' : 'Send reset link'}
        </button>
      </form>

      <p className="text-center text-sm text-[#78716C] mt-6">
        <Link href="/login" className="text-[#B45309] font-medium hover:underline">Back to sign in</Link>
      </p>
    </div>
  )
}
