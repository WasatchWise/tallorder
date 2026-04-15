'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Compass, CalendarDays, MessageCircle, Users, User, Ruler } from 'lucide-react'

const NAV_ITEMS = [
  { href: '/browse', label: 'Browse', icon: Compass },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/messages', label: 'Messages', icon: MessageCircle },
  { href: '/connections', label: 'Connect', icon: Users },
  { href: '/settings', label: 'Profile', icon: User },
]

export default function BottomNav() {
  const pathname = usePathname()
  const [pendingCount, setPendingCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [cmBalance, setCmBalance] = useState<number | null>(null)

  useEffect(() => {
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
  }, [pathname])

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#1C1917] border-t border-stone-800 md:hidden safe-area-pb">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          const showBadge = href === '/connections' && pendingCount > 0
          const showMsgBadge = href === '/messages' && unreadMessages > 0
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors duration-150 relative ${
                active ? 'text-[#D97706]' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${active ? 'fill-[#D97706] stroke-[#D97706]' : ''}`} strokeWidth={active ? 0 : 1.75} />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center gap-px bg-[#D97706] text-white text-[8px] font-bold rounded-full px-1 py-px min-w-[14px] justify-center">
                    <Ruler className="w-1.5 h-1.5" />
                    {pendingCount}
                  </span>
                )}
                {showMsgBadge && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center bg-[#D97706] text-white text-[8px] font-bold rounded-full min-w-[14px] px-1 py-px">
                    {unreadMessages}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium">
                {label === 'Profile' && cmBalance !== null ? `${cmBalance} cm` : label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
