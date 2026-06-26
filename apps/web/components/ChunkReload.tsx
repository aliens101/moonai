'use client'

import { useEffect } from 'react'

// When a new build ships, a tab left open from the previous build may lazy-load
// a chunk hash that no longer exists → ChunkLoadError. Reload once to pick up
// the fresh HTML + chunks. A short time-boxed guard prevents reload loops if the
// chunk is genuinely missing.
const KEY = 'moonai:chunk-reload-at'
const COOLDOWN_MS = 12_000

function isChunkError(message: string): boolean {
  return /ChunkLoadError|Loading chunk [\w-]+ failed|Loading CSS chunk|importing a module script failed/i.test(
    message,
  )
}

export function ChunkReload() {
  useEffect(() => {
    function recover(message: string) {
      if (!isChunkError(message)) return
      let last = 0
      try {
        last = Number(sessionStorage.getItem(KEY) || 0)
      } catch {}
      if (Date.now() - last < COOLDOWN_MS) return // just reloaded; avoid a loop
      try {
        sessionStorage.setItem(KEY, String(Date.now()))
      } catch {}
      window.location.reload()
    }

    const onError = (e: ErrorEvent) => recover(e?.message ?? '')
    const onRejection = (e: PromiseRejectionEvent) => {
      const r = e?.reason
      recover(String(r?.name ?? '') + ' ' + String(r?.message ?? r ?? ''))
    }

    window.addEventListener('error', onError)
    window.addEventListener('unhandledrejection', onRejection)
    return () => {
      window.removeEventListener('error', onError)
      window.removeEventListener('unhandledrejection', onRejection)
    }
  }, [])

  return null
}
