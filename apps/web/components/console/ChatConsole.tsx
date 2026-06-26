'use client'

import { useSuiAuth } from '@/components/SuiAuthContext'
import {
  type Conversation,
  type Msg,
  fetchRemoteConversations,
  loadConversations,
  newConversationId,
  saveConversations,
  saveRemoteConversations,
  titleFromMessages,
} from '@/lib/chat-store'
import { useEffect, useRef, useState } from 'react'
import { Chat } from './Chat'

function relTime(ts: number, now: number): string {
  const s = Math.max(0, Math.floor((now - ts) / 1000))
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

export function ChatConsole() {
  const { address: authedAddress, isAuthed } = useSuiAuth()
  const address = isAuthed ? authedAddress : null

  const [convos, setConvos] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [now, setNow] = useState(0)

  const activeIdRef = useRef<string | null>(null)
  const addrRef = useRef<string | null>(address)
  const justLoaded = useRef(false)

  // Load history when the wallet changes. Signed in → from the server (synced
  // across devices); signed out → from this browser's localStorage.
  useEffect(() => {
    addrRef.current = address
    setDrawerOpen(false)
    let cancelled = false
    ;(async () => {
      const list = address ? ((await fetchRemoteConversations()) ?? []) : loadConversations(null)
      if (cancelled) return
      justLoaded.current = true
      setConvos(list)
      const first = list[0]?.id ?? null
      setActiveId(first)
      activeIdRef.current = first
    })()
    return () => {
      cancelled = true
    }
  }, [address])

  // Persist on change (debounced; skips the re-save triggered right after a load).
  // Signed in → server; signed out → localStorage.
  useEffect(() => {
    if (justLoaded.current) {
      justLoaded.current = false
      return
    }
    const handle = setTimeout(() => {
      if (addrRef.current) void saveRemoteConversations(convos)
      else saveConversations(null, convos)
    }, 600)
    return () => clearTimeout(handle)
  }, [convos])

  // Lightweight clock so the "2m / 3h" labels stay roughly fresh.
  useEffect(() => {
    setNow(Date.now())
    const t = setInterval(() => setNow(Date.now()), 60_000)
    return () => clearInterval(t)
  }, [])

  const active = convos.find(c => c.id === activeId) ?? null
  const messages = active?.messages ?? []

  function handleMessagesChange(next: Msg[]) {
    const stamp = Date.now()
    let id = activeIdRef.current
    if (!id) {
      id = newConversationId()
      activeIdRef.current = id
      setActiveId(id)
    }
    const cid = id
    setConvos(prev => {
      if (prev.some(c => c.id === cid)) {
        return prev
          .map(c =>
            c.id === cid
              ? {
                  ...c,
                  messages: next,
                  title: c.messages.length === 0 ? titleFromMessages(next) : c.title,
                  updatedAt: stamp,
                }
              : c,
          )
          .sort((a, b) => b.updatedAt - a.updatedAt)
      }
      const convo: Conversation = {
        id: cid,
        title: titleFromMessages(next),
        messages: next,
        createdAt: stamp,
        updatedAt: stamp,
      }
      return [convo, ...prev]
    })
  }

  function startNewChat() {
    setActiveId(null)
    activeIdRef.current = null
    setDrawerOpen(false)
  }

  function selectChat(id: string) {
    setActiveId(id)
    activeIdRef.current = id
    setDrawerOpen(false)
  }

  function deleteChat(id: string) {
    setConvos(prev => {
      const remaining = prev.filter(c => c.id !== id)
      if (activeIdRef.current === id) {
        const nextId = remaining[0]?.id ?? null
        setActiveId(nextId)
        activeIdRef.current = nextId
      }
      return remaining
    })
  }

  const sidebar = (
    <SidebarBody
      convos={convos}
      activeId={activeId}
      now={now}
      onNew={startNewChat}
      onSelect={selectChat}
      onDelete={deleteChat}
    />
  )

  return (
    <div className="flex h-full min-h-0">
      <aside className="hidden w-[260px] shrink-0 overflow-hidden border-r border-[var(--color-border)] md:flex md:flex-col">
        {sidebar}
      </aside>

      {drawerOpen ? (
        <div className="fixed inset-0 z-[60] md:hidden">
          <button
            type="button"
            aria-label="Close chats"
            tabIndex={-1}
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 cursor-default bg-[color-mix(in_oklab,var(--color-ink)_28%,transparent)]"
          />
          <div className="absolute inset-y-0 left-0 flex w-[80%] max-w-[300px] flex-col border-r border-[var(--color-border)] bg-[var(--color-cream)]">
            {sidebar}
          </div>
        </div>
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <Chat
          // Remount on conversation switch so input/scroll reset cleanly.
          key={activeId ?? 'new'}
          messages={messages}
          onMessagesChange={handleMessagesChange}
          onMenu={() => setDrawerOpen(true)}
        />
      </div>
    </div>
  )
}

function SidebarBody({
  convos,
  activeId,
  now,
  onNew,
  onSelect,
  onDelete,
}: {
  convos: Conversation[]
  activeId: string | null
  now: number
  onNew: () => void
  onSelect: (id: string) => void
  onDelete: (id: string) => void
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="p-3">
        <button
          type="button"
          onClick={onNew}
          className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[var(--color-border)] px-3 py-2 text-[13px] font-medium text-[var(--color-ink)] transition-colors hover:bg-[var(--color-paper)]"
        >
          <span className="text-[15px] leading-none">+</span> New chat
        </button>
      </div>
      <div data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3">
        {convos.length === 0 ? (
          <p className="px-2 py-3 font-mono text-[11px] leading-[1.5] text-[var(--color-ink-3)]">
            No saved chats yet. Your conversations are kept per wallet.
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {convos.map(c => (
              <li key={c.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(c.id)}
                  className={`flex w-full items-baseline gap-2 rounded-lg py-2 pl-3 pr-7 text-left text-[13px] transition-colors ${
                    c.id === activeId
                      ? 'bg-[var(--color-paper)] text-[var(--color-ink)]'
                      : 'text-[var(--color-ink-2)] hover:bg-[var(--color-paper)]'
                  }`}
                  title={c.title}
                >
                  <span className="min-w-0 flex-1 truncate">{c.title}</span>
                  <span className="shrink-0 font-mono text-[10px] text-[var(--color-ink-3)] group-hover:opacity-0">
                    {relTime(c.updatedAt, now || c.updatedAt)}
                  </span>
                </button>
                <button
                  type="button"
                  aria-label="Delete chat"
                  onClick={() => onDelete(c.id)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 rounded px-1 font-mono text-[15px] leading-none text-[var(--color-ink-3)] opacity-0 transition-opacity hover:text-[var(--color-ink)] group-hover:opacity-100"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
