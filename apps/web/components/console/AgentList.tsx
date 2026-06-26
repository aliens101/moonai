'use client'

import { useAgentWallet } from '@/components/AgentWalletContext'
import { useSuiAuth } from '@/components/SuiAuthContext'
import { type AgentPolicy, getAgentPolicy } from '@/lib/chain/sui'
import { formatSui, shortAddress } from '@/lib/format'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ready'; policy: AgentPolicy | null }
  | { kind: 'error'; message: string }

const POLL_INTERVAL_MS = 30_000
const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

export function AgentList() {
  const { address } = useSuiAuth()
  const { identity } = useAgentWallet()
  const policyObjectId = identity.policyObjectId
  const [state, setState] = useState<LoadState>({ kind: 'idle' })

  useEffect(() => {
    if (!policyObjectId) {
      setState({ kind: 'ready', policy: null })
      return
    }
    let alive = true
    let isInitial = true
    setState({ kind: 'loading' })

    async function load() {
      try {
        const policy = await getAgentPolicy(policyObjectId!, identity.network)
        if (!alive) return
        setState({ kind: 'ready', policy })
      } catch (err) {
        if (alive && isInitial) setState({ kind: 'error', message: (err as Error).message })
      } finally {
        isInitial = false
      }
    }

    void load()
    const poll = setInterval(() => {
      if (alive) void load()
    }, POLL_INTERVAL_MS)
    return () => {
      alive = false
      clearInterval(poll)
    }
  }, [policyObjectId, identity.network])

  if (state.kind === 'idle' || state.kind === 'loading') {
    return (
      <p className="text-[14px] leading-[1.55] text-[var(--color-ink-2)]">
        Reading the AgentPolicy on Sui {address ? `for ${shortAddress(address)}` : ''}…
      </p>
    )
  }

  if (state.kind === 'error') {
    return (
      <p className="text-[14px] leading-[1.55] text-[var(--color-ink-2)]">
        Could not read the agent policy from Sui. {state.message}
      </p>
    )
  }

  if (!state.policy) {
    return (
      <div className="grid gap-5">
        <p className="font-display text-[clamp(26px,2.8vw,38px)] font-light leading-[1.1] tracking-tight text-[var(--color-ink)]">
          No agent on this wallet.{' '}
          <span className="font-italic-serif italic text-[var(--color-ink-2)]">Yet.</span>
        </p>
        <p className="max-w-[46ch] text-[15.5px] leading-[1.65] text-[var(--color-ink-2)]">
          Run <code className="font-mono text-[14px] text-[var(--color-ink)]">moonai init</code>, then{' '}
          <code className="font-mono text-[14px] text-[var(--color-ink)]">moonai policy create</code> to
          create an agent address + an AgentPolicy object on Sui. Then come back.
        </p>
        <Link
          href="/#run"
          className="group inline-flex w-fit items-center gap-1.5 pt-1 text-[13.5px] text-[var(--color-ink-2)] transition-colors hover:text-[var(--color-ink)]"
        >
          <span>How to install</span>
          <span aria-hidden className="transition-transform group-hover:translate-x-0.5">
            →
          </span>
        </Link>
      </div>
    )
  }

  const p = state.policy
  return (
    <div className="grid gap-2">
      <motion.p
        initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
        transition={{ duration: 0.7, delay: 0.08, ease: REVEAL_EASE }}
        className="text-[13px] text-[var(--color-ink-3)]"
      >
        1 agent, bounded by an on-chain AgentPolicy.
      </motion.p>
      <ul className="mt-4 divide-y divide-[var(--color-border)]">
        <motion.li
          initial={{ opacity: 0, y: 18, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.7, delay: 0.16, ease: REVEAL_EASE }}
        >
          <Link
            href={`/console/${p.objectId}`}
            className="group grid grid-cols-[1fr_auto] items-center gap-6 py-7 sm:gap-8"
          >
            <div className="grid gap-1.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <span
                  className="font-display text-[20px] font-light tracking-tight text-[var(--color-ink)]"
                  style={{ fontVariationSettings: '"opsz" 60, "SOFT" 30, "WONK" 0' }}
                >
                  {shortAddress(p.agent, 10, 6)}
                </span>
                {p.revoked ? (
                  <span className="font-mono text-[11.5px] text-[var(--color-ink-3)]">revoked</span>
                ) : null}
              </div>
              <p className="font-mono text-[13.5px] text-[var(--color-ink)]">
                policy {shortAddress(p.objectId, 10, 6)}
              </p>
              <p className="font-mono text-[12px] text-[var(--color-ink-3)]">
                <span className="text-[var(--color-ink-2)]">{formatSui(p.spentMist)}</span> /{' '}
                <span className="text-[var(--color-ink)]">{formatSui(p.budgetMist)}</span> SUI spent ·
                cap {formatSui(p.maxPerTxMist)} SUI/tx
              </p>
            </div>
            <span
              className="text-[13px] text-[var(--color-ink-2)] transition group-hover:text-[var(--color-ink)]"
              aria-hidden
            >
              Open{' '}
              <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
            </span>
          </Link>
        </motion.li>
      </ul>
    </div>
  )
}
