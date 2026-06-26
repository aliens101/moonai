'use client'

import { useSuiAuth } from '@/components/SuiAuthContext'
import { AgentList } from '@/components/console/AgentList'
import { ConnectGate } from '@/components/console/ConnectGate'
import { motion } from 'framer-motion'

const REVEAL_EASE = [0.22, 1, 0.36, 1] as const

export default function AgentsPage() {
  const { isAuthed, isPending } = useSuiAuth()

  return (
    <div className="mx-auto w-full max-w-[var(--container-wrap)] px-6 pb-32 pt-28 sm:px-8 sm:pt-32">
      <header className="grid gap-3 pb-8">
        <motion.h1
          initial={{ opacity: 0, y: 16, filter: 'blur(6px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          transition={{ duration: 0.8, ease: REVEAL_EASE }}
          className="font-display font-light leading-[1.04] tracking-tight text-[var(--color-ink)]"
          style={{
            fontSize: 'clamp(34px, 4vw, 56px)',
            fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 0',
          }}
        >
          Your agent{' '}
          <span className="align-middle font-mono text-[14px] text-[var(--color-ink-3)]">
            AgentPolicy
          </span>
        </motion.h1>
        <p className="max-w-[58ch] text-[15.5px] leading-[1.6] text-[var(--color-ink-2)]">
          A Sui-native agent you own — its address, its on-chain AgentPolicy (budget, caps,
          allowlists, expiry), and its ActionReceipts. Connect and sign in to load it from chain.
        </p>
      </header>

      {isPending ? (
        <div className="min-h-[80px]" aria-hidden />
      ) : isAuthed ? (
        <AgentList />
      ) : (
        <ConnectGate />
      )}
    </div>
  )
}
