'use client'

// The agent / policy detail view.
//
// The dynamic segment is named `[tokenId]` for route stability, but on Sui there
// is no NFT/token id: the param is the agent's **AgentPolicy object id** (or, as
// a fallback, the agent's Sui address). We resolve the AgentPolicy + recent
// ActionReceipts from chain and render the fund-control bounds the agent runs
// under.

import { getConfiguredAgentIdentity } from '@/lib/agent-wallet'
import {
  type ActionReceipt,
  type AgentPolicy,
  getAgentPolicy,
  getRecentReceipts,
} from '@/lib/chain/sui'
import { accountUrl, objectUrl, txUrl } from '@/lib/chainscan'
import { formatSui, shortAddress } from '@/lib/format'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { use as usePromise, useEffect, useState } from 'react'

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

export default function AgentDetailPage(props: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = usePromise(props.params)
  const network = getConfiguredAgentIdentity().network

  const [policy, setPolicy] = useState<AgentPolicy | null>(null)
  const [receipts, setReceipts] = useState<ActionReceipt[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let alive = true
    setLoading(true)
    setError(null)
    ;(async () => {
      try {
        const p = await getAgentPolicy(tokenId, network)
        if (!alive) return
        setPolicy(p)
        if (p) {
          const rs = await getRecentReceipts(p.agent, network).catch(() => [])
          if (!alive) return
          setReceipts(rs)
        }
        setLoading(false)
      } catch (e) {
        if (!alive) return
        setError((e as Error).message)
        setLoading(false)
      }
    })()
    return () => {
      alive = false
    }
  }, [tokenId, network])

  if (loading) {
    return (
      <p className="pt-2 text-[14px] text-[var(--color-ink-2)]">
        Loading AgentPolicy {shortAddress(tokenId)}…
      </p>
    )
  }

  if (error || !policy) {
    return (
      <div className="grid gap-3 pt-2">
        <BackLink />
        <p className="text-[15.5px] leading-[1.6] text-[var(--color-ink-2)]">
          {error ?? `No AgentPolicy at ${shortAddress(tokenId)}.`}
        </p>
      </div>
    )
  }

  const expired = policy.expiryMs > 0n && policy.expiryMs < BigInt(Date.now())

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
      animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      transition={{ duration: 0.7, ease: REVEAL_EASE }}
      className="grid gap-12 pt-2"
    >
      <header className="grid gap-3">
        <BackLink />
        <h1
          className="font-display font-light leading-[1.04] tracking-tight text-[var(--color-ink)]"
          style={{
            fontSize: 'clamp(30px, 3.6vw, 52px)',
            fontVariationSettings: '"opsz" 80, "SOFT" 30, "WONK" 0',
          }}
        >
          {shortAddress(policy.agent, 10, 6)}
        </h1>
        <p className="max-w-[62ch] text-[15.5px] leading-[1.6] text-[var(--color-ink-2)]">
          This agent acts only within its on-chain AgentPolicy. Deterministic Move code enforces every
          bound below — the model proposes, the policy disposes.
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 font-mono text-[12.5px] text-[var(--color-ink-3)]">
          <a
            href={objectUrl(policy.objectId, network)}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-[var(--color-ink)]"
          >
            policy {shortAddress(policy.objectId, 8, 6)} ↗
          </a>
          <a
            href={accountUrl(policy.agent, network)}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-[var(--color-ink)]"
          >
            agent {shortAddress(policy.agent, 8, 6)} ↗
          </a>
          <a
            href={accountUrl(policy.owner, network)}
            target="_blank"
            rel="noreferrer"
            className="transition-colors hover:text-[var(--color-ink)]"
          >
            owner {shortAddress(policy.owner, 8, 6)} ↗
          </a>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          {policy.revoked ? <Badge tone="bad">revoked</Badge> : <Badge tone="ok">active</Badge>}
          {expired ? <Badge tone="bad">expired</Badge> : null}
        </div>
      </header>

      <section className="grid gap-4">
        <span className="kicker">BUDGET · SUI</span>
        <div className="flex flex-wrap items-baseline gap-10">
          <Stat value={formatSui(policy.spentMist)} label="spent (SUI)" />
          <Stat value={formatSui(policy.budgetMist)} label="budget (SUI)" />
          <Stat value={formatSui(policy.maxPerTxMist)} label="per-tx cap (SUI)" />
          <Stat
            value={
              policy.budgetMist > 0n ? formatSui(policy.budgetMist - policy.spentMist) : '—'
            }
            label="remaining (SUI)"
          />
        </div>
      </section>

      <section className="grid gap-3">
        <span className="kicker">ALLOWED COINS</span>
        {policy.allowedCoins.length === 0 ? (
          <p className="text-[14px] text-[var(--color-ink-3)]">Any coin (no allowlist set).</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {policy.allowedCoins.map(c => (
              <span
                key={c}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-[12px] text-[var(--color-ink-2)]"
              >
                {shortType(c)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-3">
        <span className="kicker">ALLOWED PROTOCOLS</span>
        {policy.allowedProtocols.length === 0 ? (
          <p className="text-[14px] text-[var(--color-ink-3)]">Any protocol (no allowlist set).</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {policy.allowedProtocols.map(p => (
              <span
                key={p}
                className="rounded-full border border-[var(--color-border)] px-3 py-1 font-mono text-[12px] text-[var(--color-ink-2)]"
              >
                {shortAddress(p, 8, 6)}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="grid gap-2">
        <span className="kicker">EXPIRY</span>
        <p className="font-mono text-[13.5px] text-[var(--color-ink-2)]">
          {policy.expiryMs > 0n
            ? new Date(Number(policy.expiryMs)).toUTCString().replace('GMT', 'UTC')
            : 'no expiry'}
        </p>
      </section>

      <section className="grid gap-4">
        <span className="kicker">RECENT ACTION RECEIPTS</span>
        {receipts.length === 0 ? (
          <p className="text-[14px] text-[var(--color-ink-3)]">No receipts recorded yet.</p>
        ) : (
          <ul className="divide-y divide-[var(--color-border)]">
            {receipts.map(r => (
              <li
                key={r.objectId}
                className="grid grid-cols-[1fr_auto] items-center gap-4 py-4"
              >
                <div className="grid min-w-0 gap-0.5">
                  <span className="truncate text-[14px] text-[var(--color-ink)]">
                    {r.action ?? 'action'}
                    {r.amountMist !== undefined ? ` · ${formatSui(r.amountMist)} SUI` : ''}
                  </span>
                  <span className="truncate font-mono text-[12px] text-[var(--color-ink-3)]">
                    {r.timestampMs !== undefined
                      ? new Date(Number(r.timestampMs)).toUTCString().replace('GMT', 'UTC')
                      : shortAddress(r.objectId, 10, 8)}
                  </span>
                </div>
                <a
                  href={txUrl(r.objectId, network)}
                  target="_blank"
                  rel="noreferrer"
                  className="shrink-0 font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]"
                >
                  verify ↗
                </a>
              </li>
            ))}
          </ul>
        )}
      </section>
    </motion.div>
  )
}

function shortType(t: string): string {
  // Show the trailing struct name of a fully-qualified coin type.
  const parts = t.split('::')
  return parts.length >= 2 ? parts.slice(-2).join('::') : shortAddress(t, 8, 6)
}

function BackLink() {
  return (
    <Link
      href="/console/agents"
      className="group w-fit text-[13px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink)]"
    >
      <span className="inline-block transition-transform group-hover:-translate-x-0.5">←</span> back
      to agent
    </Link>
  )
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="grid gap-1">
      <span className="font-display text-[40px] font-light leading-none text-[var(--color-ink)]">
        {value}
      </span>
      <span className="font-mono text-[11px] text-[var(--color-ink-3)]">{label}</span>
    </div>
  )
}

function Badge({ children, tone }: { children: React.ReactNode; tone: 'ok' | 'bad' }) {
  const cls =
    tone === 'ok'
      ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
      : 'border-red-300 bg-red-50 text-red-700'
  return (
    <span className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] ${cls}`}>
      {children}
    </span>
  )
}
