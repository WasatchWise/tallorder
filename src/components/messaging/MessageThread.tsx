'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Send } from 'lucide-react'
import Link from 'next/link'

interface Message {
  id: string
  sender_id: string
  content: string
  read_at: string | null
  created_at: string
}

interface Props {
  connectionId: string
  userId: string
  otherPseudonym: string
  initialMessages: Message[]
}

function formatTime(ts: string) {
  const d = new Date(ts)
  const now = new Date()
  const isToday = d.toDateString() === now.toDateString()
  return isToday
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export default function MessageThread({ connectionId, userId, otherPseudonym, initialMessages }: Props) {
  const supabase = createClient()
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${connectionId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `connection_id=eq.${connectionId}` },
        (payload) => {
          setMessages(prev => {
            if (prev.find(m => m.id === payload.new.id)) return prev
            // Remove any optimistic messages from this sender with matching content
            const newMsg = payload.new as Message
            const withoutOptimistic = prev.filter(m =>
              !m.id.startsWith('optimistic-') || m.sender_id !== newMsg.sender_id || m.content !== newMsg.content
            )
            return [...withoutOptimistic, newMsg]
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [connectionId])

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    const content = text.trim()
    if (!content || sending) return
    setSending(true)
    setText('')

    // Optimistic update: show the message immediately
    const optimisticMsg: Message = {
      id: `optimistic-${Date.now()}`,
      sender_id: userId,
      content,
      read_at: null,
      created_at: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimisticMsg])

    try {
      const res = await fetch('/api/messages/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ connectionId, content }),
      })
      if (!res.ok) {
        // Remove optimistic message and restore text on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
        setText(content)
      }
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optimisticMsg.id))
      setText(content)
    }
    setSending(false)
    inputRef.current?.focus()
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  // Group messages by date
  const grouped: { date: string; messages: Message[] }[] = []
  messages.forEach(msg => {
    const date = new Date(msg.created_at).toDateString()
    const last = grouped[grouped.length - 1]
    if (last?.date === date) {
      last.messages.push(msg)
    } else {
      grouped.push({ date, messages: [msg] })
    }
  })

  return (
    <div className="flex-1 flex flex-col max-w-[640px] mx-auto w-full">
      {/* Thread header */}
      <div className="bg-white border-b border-[#E7E5E4] px-4 py-3 flex items-center gap-3">
        <Link href="/messages" className="text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <p className="text-sm font-semibold text-[#1C1917]">{otherPseudonym}</p>
          <Link href={`/profile/${otherPseudonym}`} className="text-xs text-[#B45309] hover:underline">View profile</Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {grouped.map(group => (
          <div key={group.date}>
            <div className="text-center mb-3">
              <span className="text-xs text-[#78716C] bg-[#F5F5F4] px-2 py-0.5 rounded-full">
                {new Date(group.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
            <div className="space-y-1.5">
              {group.messages.map(msg => {
                const isMine = msg.sender_id === userId
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isMine
                        ? 'bg-[#B45309] text-white rounded-br-sm'
                        : 'bg-white border border-[#E7E5E4] text-[#1C1917] rounded-bl-sm'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-amber-100' : 'text-[#78716C]'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}
        {messages.length === 0 && (
          <div className="text-center py-12">
            <p className="text-sm text-[#78716C]">You're connected. Say hello.</p>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-[#E7E5E4] px-4 py-3 flex items-end gap-2">
        <textarea
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          rows={1}
          className="flex-1 border border-[#D6D3D1] rounded-xl px-3.5 py-2.5 text-sm text-[#1C1917] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#D97706] focus:border-transparent resize-none transition-all duration-150"
          style={{ maxHeight: '120px', overflowY: 'auto' }}
        />
        <button
          onClick={send}
          disabled={!text.trim() || sending}
          className="w-10 h-10 rounded-xl bg-[#D97706] hover:bg-[#B45309] text-white flex items-center justify-center shrink-0 transition-all duration-150 cursor-pointer disabled:opacity-40 active:scale-[0.95]"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
