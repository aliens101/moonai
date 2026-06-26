'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { ENIGMA } from '@/lib/snapshot'

const GATES: Array<{ kind: string; tool: string }> = [
  { kind: 'policy', tool: 'in-cap · allowlisted' },
  { kind: 'simulate', tool: 'would succeed' },
  { kind: 'approval', tool: 'auto (in tier)' },
  { kind: 'execute', tool: 'receipt 0x4f7a…9d4c' },
]

export function Mindmap() {
  return (
    <div className="space-y-6">
      <div>
        <div className="kicker mb-3">CHAPTER · III</div>
        <h2 className="font-display text-[44px] font-light leading-[1.02] tracking-[-0.018em] text-[var(--color-ink)]">
          The boundary, <span className="font-italic-serif italic">mapped</span>.
        </h2>
        <p className="mt-4 text-[15px] leading-relaxed text-[var(--color-ink-2)]">
          A worked example of the four-gate pipeline a value-moving action crosses before it ever
          reaches Sui.
        </p>
      </div>

      <div className="rounded-[12px] border border-[var(--color-border)] bg-[var(--color-paper)] p-5">
        <div className="font-mono mb-2 flex items-center justify-between text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-ink-3)]">
          <span>moonai agent</span>
          <span className="inline-flex items-center gap-1 text-[var(--color-ink)]">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.4, repeat: Number.POSITIVE_INFINITY }}
              className="block h-1.5 w-1.5 rounded-full bg-[var(--color-ink)]"
            />
            armed
          </span>
        </div>
        <div className="font-display text-[26px] leading-none text-[var(--color-ink)]">
          the agent
        </div>
        <div className="font-mono mt-1 text-[11px] text-[var(--color-ink-2)]">
          Sui · SUI · @mysten/sui
        </div>
        <UptimeRow />
        <div className="font-mono mt-3 grid grid-cols-3 gap-2 text-[11px]">
          <Pill label="advise" value="LLM" />
          <Pill label="enforce" value="code" />
          <Pill label="record" value="tx" />
        </div>
      </div>

      <div className="space-y-2">
        {GATES.map(gate => (
          <div
            key={gate.kind}
            className="flex items-baseline justify-between gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-paper)] px-3 py-2 text-[12px]"
          >
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-ink-3)]">
              {gate.kind}
            </span>
            <span className="text-[var(--color-ink)]">{gate.tool}</span>
          </div>
        ))}
      </div>

      <p className="text-[14px] leading-relaxed text-[var(--color-ink-2)]">
        Every write crosses the same gates before it touches Sui. The model proposes; code disposes.
      </p>
      <p className="font-mono text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
        illustrative pipeline · not a live trade
      </p>
    </div>
  )
}

function Pill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-cream)]/55 px-2 py-1 text-center">
      <div className="text-[9px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
        {label}
      </div>
      <div className="text-[11px] text-[var(--color-ink)]">{value}</div>
    </div>
  )
}

function UptimeRow() {
  const [delta, setDelta] = useState<number>(ENIGMA.uptimeSeconds)
  useEffect(() => {
    const id = setInterval(() => setDelta(d => d + 1), 1000)
    return () => clearInterval(id)
  }, [])
  const h = Math.floor(delta / 3600)
  const m = Math.floor((delta % 3600) / 60)
  const s = delta % 60
  return (
    <div className="font-mono mt-3 flex items-baseline justify-between text-[10.5px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
      <span>uptime</span>
      <span className="text-[var(--color-ink)] normal-case">
        {h}h {String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
      </span>
    </div>
  )
}
