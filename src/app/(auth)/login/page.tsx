'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function LoginContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const nextParam = searchParams.get('next')
  const next = nextParam && nextParam.startsWith('/') && !nextParam.includes('//') ? nextParam : '/browse'

  const [mode, setMode] = useState<'password' | 'magic'>('password')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [linkSent, setLinkSent] = useState(false)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)
  const [ready, setReady] = useState(false)

  // Clear stale auth state on mount, prevents PKCE cookie conflicts in mobile webviews
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.signOut().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="w-full max-w-sm flex items-center justify-center py-16">
        <div className="w-6 h-6 border-2 border-[#D97706] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setEmailNotConfirmed(false)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setEmailNotConfirmed(true)
      } else {
        setError(error.message)
      }
      setLoading(false)
    } else {
      fetch('/api/auth/log-login', { method: 'POST' }).catch(() => {})
      router.push(next)
      router.refresh()
    }
  }

  async function handleSendLink(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setLinkSent(true)
      setLoading(false)
    }
  }

  // Magic link sent confirmation
  if (mode === 'magic' && linkSent) {
    return (
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
            <span className="text-[#D97706] text-xl">&#9993;</span>
          </div>
          <h1 className="text-xl font-bold text-[#1C1917] mb-2">Check your email</h1>
          <p className="text-[#78716C] text-sm">
            We sent a sign-in link to <strong>{email}</strong>. Click it and you're in.
          </p>
        </div>

        <button
          onClick={() => { setLinkSent(false); setError('') }}
          className="w-full text-sm text-[#78716C] hover:text-[#1C1917] transition-colors"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1C1917] mb-1">Welcome back</h1>
        <p className="text-[#78716C] text-sm">Sign in to your Tall Order account</p>
      </div>

      {urlError === 'auth_callback_failed' && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          That sign-in link expired or was already used. Try requesting a new one, or sign in with your password.
        </div>
      )}

      {/* Mode toggle */}
      <div className="flex rounded-lg border border-[#E7E5E4] p-1 mb-6 bg-white">
        <button
          onClick={() => { setMode('password'); setEmailNotConfirmed(false); setError('') }}
          className={`flex-1 py-2 text-sm font-medium rounded-md cursor-pointer transition-all duration-150 ${
            mode === 'password' ? 'bg-[#1C1917] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          Password
        </button>
        <button
          onClick={() => { setMode('magic'); setEmailNotConfirmed(false); setError('') }}
          className={`flex-1 py-2 text-sm font-medium rounded-md cursor-pointer transition-all duration-150 ${
            mode === 'magic' ? 'bg-[#1C1917] text-white' : 'text-[#78716C] hover:text-[#1C1917]'
          }`}
        >
          Email link
        </button>
      </div>

      {emailNotConfirmed && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
          <p className="font-semibold mb-1">Email not confirmed yet.</p>
          <p className="mb-2">Skip the verification step by signing in with a magic link instead.</p>
          <button
            onClick={() => { setMode('magic'); setEmailNotConfirmed(false) }}
            className="text-[#B45309] font-semibold underline"
          >
            Switch to email link
          </button>
        </div>
      )}

      {error && (
        <p className="text-[#DC2626] text-sm mb-4 p-3 bg-red-50 rounded-lg">{error}</p>
      )}

      <form onSubmit={mode === 'password' ? handlePasswordLogin : handleSendLink} className="space-y-4">
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

        {mode === 'password' && (
          <div>
            <label htmlFor="password" className="block text-xs font-medium text-[#1C1917] mb-1.5">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="Your password"
              className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg transition-all duration-150 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.98]"
        >
          {loading ? 'Sending...' : mode === 'magic' ? 'Send sign-in link' : 'Sign in'}
        </button>

        {mode === 'password' && (
          <p className="text-center text-sm">
            <Link href="/forgot-password" className="text-[#B45309] font-medium hover:underline">Forgot password?</Link>
          </p>
        )}
      </form>

      <p className="text-center text-sm text-[#78716C] mt-6">
        No account?{' '}
        <Link href="/signup" className="text-[#B45309] font-medium hover:underline">Join free</Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  )
}
