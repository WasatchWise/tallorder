'use client'

import { useState } from 'react'
import { ShieldOff, Loader2 } from 'lucide-react'

interface BlockedUser {
  blocked_id: string
  pseudonym: string
}

export default function BlockedUsers({ initial }: { initial: BlockedUser[] }) {
  const [blocked, setBlocked] = useState(initial)
  const [loading, setLoading] = useState<string | null>(null)

  async function unblock(blockedId: string) {
    if (!confirm('Unblock this user? They will be able to see your profile again.')) return
    setLoading(blockedId)
    await fetch('/api/block/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blocked_id: blockedId }),
    })
    setBlocked(b => b.filter(u => u.blocked_id !== blockedId))
    setLoading(null)
  }

  if (blocked.length === 0) return null

  return (
    <div className="bg-white border border-[#E7E5E4] rounded-xl overflow-hidden">
      <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider px-5 pt-5 pb-3">Blocked Users</p>
      {blocked.map(u => (
        <div
          key={u.blocked_id}
          className="flex items-center justify-between px-5 py-3.5 border-t border-[#E7E5E4]"
        >
          <div className="flex items-center gap-3">
            <ShieldOff className="w-4 h-4 text-[#78716C]" />
            <span className="text-sm text-[#1C1917]">{u.pseudonym}</span>
          </div>
          <button
            onClick={() => unblock(u.blocked_id)}
            disabled={loading === u.blocked_id}
            className="text-xs font-semibold text-[#D97706] hover:underline disabled:opacity-50 cursor-pointer"
          >
            {loading === u.blocked_id ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              'Unblock'
            )}
          </button>
        </div>
      ))}
    </div>
  )
}
