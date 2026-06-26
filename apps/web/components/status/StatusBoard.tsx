'use client'

import { useCallback, useEffect, useState } from 'react'

type ServiceStatus = 'operational' | 'degraded' | 'down'
type Service = { id: string; name: string; status: ServiceStatus; detail: string }
type Health = { status: ServiceStatus; checkedAt: string; services: Service[] }

const COLOR: Record<ServiceStatus, string> = {
  operational: '#2e9e6b',
  degraded: '#d99a2b',
  down: '#d9534f',
}
const LABEL: Record<ServiceStatus, string> = {
  operational: 'Operational',
  degraded: 'Degraded',
  down: 'Down',
}
const HEADLINE: Record<ServiceStatus, string> = {
  operational: 'All systems operational',
  degraded: 'Partial degradation',
  down: 'Major outage',
}

export function StatusBoard() {
  const [data, setData] = useState<Health | null>(null)
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(false)

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/health', { cache: 'no-store' })
      if (!r.ok) throw new Error('bad status')
      setData((await r.json()) as Health)
      setErr(false)
    } catch {
      setErr(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
    const id = setInterval(() => void load(), 30_000)
    return () => clearInterval(id)
  }, [load])

  const overall: ServiceStatus = err ? 'down' : (data?.status ?? 'operational')

  return (
    <div className="mt-10">
      {/* Overall banner */}
      <div
        className="flex items-center gap-3 rounded-2xl border bg-[var(--color-paper)] px-5 py-4"
        style={{ borderColor: COLOR[overall] }}
      >
        <Dot status={overall} size={11} pulse />
        <div className="flex-1">
          <div className="text-[16px] font-semibold text-[var(--color-ink)]">
            {loading ? 'Checking…' : err ? 'Status check failed' : HEADLINE[overall]}
          </div>
          <div className="font-mono text-[11.5px] text-[var(--color-ink-3)]">
            {data ? `Last checked ${new Date(data.checkedAt).toLocaleTimeString()}` : 'live'}
          </div>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-full border border-[var(--color-border-strong)] px-3 py-1.5 text-[12.5px] font-medium text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
        >
          Refresh
        </button>
      </div>

      {/* Per-service rows */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)]">
        {(data?.services ?? PLACEHOLDER).map((s, i) => (
          <div
            key={s.id}
            className={`flex items-center justify-between gap-3 px-5 py-4 ${
              i > 0 ? 'border-t border-[var(--color-border)]' : ''
            }`}
          >
            <div>
              <div className="text-[14px] text-[var(--color-ink)]">{s.name}</div>
              <div className="font-mono text-[11.5px] text-[var(--color-ink-3)]">
                {err ? '—' : s.detail}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="text-[12.5px] font-medium"
                style={{ color: err ? COLOR.down : COLOR[s.status] }}
              >
                {err ? LABEL.down : LABEL[s.status]}
              </span>
              <Dot status={err ? 'down' : s.status} size={9} />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-[12px] text-[var(--color-ink-3)]">
        Checks run live from your browser and refresh every 30 seconds. Chain rows ping the public
        Sui RPC directly.
      </p>
    </div>
  )
}

const PLACEHOLDER: Service[] = [
  { id: 'web', name: 'Web console', status: 'operational', detail: '…' },
  { id: 'api', name: 'Chat & agent API', status: 'operational', detail: '…' },
  { id: 'sui', name: 'Sui network', status: 'operational', detail: '…' },
  { id: 'walrus', name: 'Walrus storage', status: 'operational', detail: '…' },
]

function Dot({ status, size, pulse }: { status: ServiceStatus; size: number; pulse?: boolean }) {
  return (
    <span className="relative inline-flex" style={{ width: size, height: size }}>
      {pulse ? (
        <span
          className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
          style={{ backgroundColor: COLOR[status] }}
        />
      ) : null}
      <span
        className="relative inline-flex rounded-full"
        style={{ width: size, height: size, backgroundColor: COLOR[status] }}
      />
    </span>
  )
}
