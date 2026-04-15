'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { Menu, X, Ruler } from 'lucide-react'
import { usePathname } from 'next/navigation'
import BottomNav from './BottomNav'

interface HeaderProps {
  user?: { pseudonym?: string } | null
}

export default function Header({ user }: HeaderProps) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [cmBalance, setCmBalance] = useState<number | null>(null)

  useEffect(() => {
    if (!user) return
    fetch('/api/connections/pending-count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count) setPendingCount(d.count) })
      .catch(() => {})
    fetch('/api/messages/unread-count')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.count) setUnreadMessages(d.count) })
      .catch(() => {})
    fetch('/api/tokens/balance')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d != null) setCmBalance(d.balance) })
      .catch(() => {})
  }, [user, pathname])

  return (
    <header className="sticky top-0 z-50 bg-[#1C1917] h-14 md:h-16 flex items-center px-4 md:px-6">
      <div className="max-w-[1152px] mx-auto w-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/images/logo-dark.png"
            alt="Tall Order"
            width={200}
            height={54}
            className="h-10 md:h-12 w-auto"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {user ? (
            <>
              <Link href="/browse" className="text-[#F5F5F4] text-sm font-medium hover:text-[#D97706] transition-colors duration-150">Browse</Link>
              <Link href="/connections" className="relative text-[#F5F5F4] text-sm font-medium hover:text-[#D97706] transition-colors duration-150">
                Connections
                {pendingCount > 0 && (
                  <span className="absolute -top-2 -right-4 flex items-center gap-px bg-[#D97706] text-white text-[9px] font-bold rounded-full px-1 py-px min-w-[16px] justify-center">
                    <Ruler className="w-2 h-2" />
                    {pendingCount}
                  </span>
                )}
              </Link>
              <Link href="/messages" className="relative text-[#F5F5F4] text-sm font-medium hover:text-[#D97706] transition-colors duration-150">
                Messages
                {unreadMessages > 0 && (
                  <span className="absolute -top-2 -right-3 flex items-center justify-center bg-[#D97706] text-white text-[9px] font-bold rounded-full min-w-[16px] px-1 py-px">
                    {unreadMessages}
                  </span>
                )}
              </Link>
              <Link href="/events" className="text-[#F5F5F4] text-sm font-medium hover:text-[#D97706] transition-colors duration-150">Events</Link>
              {cmBalance !== null && (
                <Link href="/settings" className="flex items-center gap-1 text-[#D97706] text-sm font-medium hover:text-[#F59E0B] transition-colors duration-150">
                  <Ruler className="w-3.5 h-3.5" />
                  {cmBalance} cm
                </Link>
              )}
              <Link href="/settings" className="text-sm font-semibold text-[#1C1917] bg-[#D97706] hover:bg-[#B45309] px-4 py-2 rounded-lg transition-colors duration-150">
                {user.pseudonym ?? 'Profile'}
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="text-[#F5F5F4] text-sm font-medium hover:text-[#D97706] transition-colors duration-150">Sign in</Link>
              <Link href="/signup" className="text-sm font-semibold text-[#1C1917] bg-[#D97706] hover:bg-[#B45309] px-4 py-2 rounded-lg transition-colors duration-150">
                Join free
              </Link>
            </>
          )}
        </nav>

        {/* Mobile menu toggle -- only for logged-out users */}
        {!user && (
          <button
            className="md:hidden text-[#F5F5F4] cursor-pointer p-1"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Close menu' : 'Open menu'}
          >
            {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        )}
      </div>

      {/* Mobile menu -- logged-out only */}
      {open && !user && (
        <div className="absolute top-14 left-0 right-0 bg-[#1C1917] border-t border-stone-800 px-4 py-4 flex flex-col gap-4 md:hidden">
          <Link href="/login" className="text-[#F5F5F4] text-sm font-medium py-2" onClick={() => setOpen(false)}>Sign in</Link>
          <Link href="/signup" className="text-sm font-semibold text-center text-[#1C1917] bg-[#D97706] px-4 py-3 rounded-lg" onClick={() => setOpen(false)}>Join free</Link>
        </div>
      )}

      {/* Bottom nav for authenticated users */}
      {user && <BottomNav />}
    </header>
  )
}
