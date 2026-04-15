'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogOut } from 'lucide-react'

export default function SignOutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center gap-3 text-sm text-[#1C1917] hover:text-red-600 transition-colors"
    >
      <LogOut className="w-4 h-4" />
      Sign out
    </button>
  )
}
