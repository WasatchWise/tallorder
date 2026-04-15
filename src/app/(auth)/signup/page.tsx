'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'


export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [gender, setGender] = useState('')
  const [heightFt, setHeightFt] = useState('')
  const [heightIn, setHeightIn] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [agreedToTerms, setAgreedToTerms] = useState(false)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!agreedToTerms) {
      setError('You must agree to the Terms and Community Guidelines to create an account.')
      return
    }

    setLoading(true)
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          height_ft: parseInt(heightFt),
          height_in: parseInt(heightIn || '0'),
          gender,
          terms_accepted_at: new Date().toISOString(),
        },
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSuccess(true)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[#FEF3C7] flex items-center justify-center mx-auto mb-4">
          <span className="text-[#D97706] text-xl">&#10003;</span>
        </div>
        <h1 className="text-xl font-bold text-[#1C1917] mb-2">Check your email</h1>
        <p className="text-[#78716C] text-sm">
          We sent a verification link to <strong>{email}</strong>. Click it to activate your account and set up your profile.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-[#1C1917] mb-1">Create your account</h1>
        <p className="text-[#78716C] text-sm">Free to join. No credit card required.</p>
      </div>

      {error && (
        <p className="text-[#DC2626] text-sm mb-4 p-3 bg-red-50 rounded-lg leading-relaxed">{error}</p>
      )}

      <form onSubmit={handleSignup} className="space-y-4">
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

        <div>
          <label htmlFor="password" className="block text-xs font-medium text-[#1C1917] mb-1.5">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={8}
            placeholder="At least 8 characters"
            className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150"
          />
        </div>

        <div>
          <label htmlFor="gender" className="block text-xs font-medium text-[#1C1917] mb-1.5">I identify as</label>
          <select
            id="gender"
            value={gender}
            onChange={e => setGender(e.target.value)}
            required
            className="w-full border border-[#D6D3D1] rounded-lg px-4 py-3 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 cursor-pointer bg-white"
          >
            <option value="">Select one</option>
            <option value="male">Man</option>
            <option value="female">Woman</option>
            <option value="nonbinary">Non-binary</option>
            <option value="prefer_not">Prefer not to say</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-[#1C1917] mb-1.5">
            My height
          </label>
          <div className="flex gap-2">
            <select
              value={heightFt}
              onChange={e => setHeightFt(e.target.value)}
              required
              className="flex-1 border border-[#D6D3D1] rounded-lg px-3 py-3 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 cursor-pointer bg-white"
            >
              <option value="">ft</option>
              {[4, 5, 6, 7].map(ft => <option key={ft} value={ft}>{ft} ft</option>)}
            </select>
            <select
              value={heightIn}
              onChange={e => setHeightIn(e.target.value)}
              className="flex-1 border border-[#D6D3D1] rounded-lg px-3 py-3 text-sm text-[#1C1917] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent transition-all duration-150 cursor-pointer bg-white"
            >
              {[0,1,2,3,4,5,6,7,8,9,10,11].map(i => <option key={i} value={i}>{i} in</option>)}
            </select>
          </div>
        </div>

        <label className="flex items-start gap-2 cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={agreedToTerms}
            onChange={e => setAgreedToTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#D6D3D1] text-[#D97706] focus:ring-[#D97706] cursor-pointer accent-[#D97706]"
          />
          <span className="text-[#78716C] text-xs leading-relaxed">
            I agree to the{' '}
            <Link href="/terms" className="text-[#B45309] hover:underline">Terms of Service</Link>{' '}
            and{' '}
            <Link href="/community-guidelines" className="text-[#B45309] hover:underline">Community Guidelines</Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#D97706] hover:bg-[#B45309] text-white font-semibold py-3 rounded-lg transition-all duration-150 text-sm disabled:opacity-50 cursor-pointer active:scale-[0.98] mt-2"
        >
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-[#78716C] mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-[#B45309] font-medium hover:underline">Sign in</Link>
      </p>
    </div>
  )
}
