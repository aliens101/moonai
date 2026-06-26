'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { LayerHeader } from './V2Identity'

const MEMORY_BODY = [
  'action: scallop.supply',
  'amount: 25,000 USDC',
  'autonomy tier: auto',
  '',
  '## Why approval',
  'In-cap and simulation-clean, but the size',
  'crosses the material-risk threshold. The approval',
  'floor sits beneath the session mode, so this',
  'pauses for a human even under YOLO.',
]

const HEX_GLYPHS = '0123456789abcdef·'

export function V4Memory() {
  return (
    <section
      id="layer-memory"
      className="relative flex min-h-screen items-center py-[var(--section-py)]"
    >
      <div className="mx-auto w-full max-w-[var(--container-wrap)] px-6 sm:px-8">
        <LayerHeader idx="03" title="Approval" pill="Gate 03 · human floor" />
        <div className="grid items-center gap-12 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-5">
            <motion.h2
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1] }}
              className="font-display text-[clamp(36px,5vw,68px)] font-light leading-[1.04] tracking-[-0.018em] text-[var(--color-ink)]"
            >
              A floor the mode <span className="font-italic-serif italic">can't</span> lower.
            </motion.h2>
            <p className="max-w-md text-[15px] leading-relaxed text-[var(--color-ink-2)]">
              The approval floor sits beneath the session permission mode. A material-risk action
              prompts for human approval even under YOLO, and is denied outright under strict. The
              model has no way to talk its way past it, because the verdict lives in code, not in
              the prompt.
            </p>
          </div>
          <div className="lg:col-span-7">
            <FileCard />
          </div>
        </div>
      </div>
    </section>
  )
}

function FileCard() {
  const [scrambled, setScrambled] = useState(false)

  useEffect(() => {
    let resetTimer: ReturnType<typeof setTimeout> | null = null
    const id = setInterval(() => {
      setScrambled(true)
      resetTimer = setTimeout(() => setScrambled(false), 700)
    }, 8200)
    return () => {
      clearInterval(id)
      if (resetTimer) clearTimeout(resetTimer)
    }
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto max-w-[560px]"
    >
      <div
        className="relative rounded-[10px] bg-[var(--color-paper)] p-6"
        style={{ boxShadow: 'var(--shadow-doc-asym)' }}
      >
        <div className="font-mono mb-3 flex items-center justify-between text-[10.5px] uppercase tracking-[0.22em] text-[var(--color-ink-3)]">
          <span>approval/pending.md</span>
          <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-cream-warm)] px-2 py-0.5 text-[9px] tracking-[0.18em] text-[var(--color-ink-2)]">
            AWAITING
          </span>
        </div>

        <pre className="font-mono mb-4 whitespace-pre-wrap break-words text-[12px] leading-[1.65] text-[var(--color-ink)]">
          {MEMORY_BODY.map((line, i) => (
            <ScrambleLine key={i} line={line} scrambled={scrambled} />
          ))}
        </pre>

        <div className="space-y-1.5 border-t border-[var(--color-border)] pt-3 text-[11.5px]">
          <Row label="policy" value="in-cap · simulation clean" />
          <Row label="risk" value="material · size threshold" />
          <Row label="session mode" value="off (YOLO) · still prompts" />
        </div>
      </div>

      <p className="mt-5 text-center text-[13px] text-[var(--color-ink-2)]">
        proposed, simulated, held for a human. An illustrative approval, not a live action.
      </p>
    </motion.div>
  )
}

function ScrambleLine({ line, scrambled }: { line: string; scrambled: boolean }) {
  if (!scrambled || line === '') {
    return <span className="block">{line || ' '}</span>
  }
  return (
    <span className="block">
      {line.split('').map((char, i) =>
        char === ' ' ? (
          <span key={i}> </span>
        ) : (
          <motion.span
            key={i}
            animate={{ opacity: [1, 0.4, 1] }}
            transition={{ duration: 0.7, ease: 'easeInOut' }}
            className="inline-block text-[var(--color-ink-2)]"
          >
            {HEX_GLYPHS[Math.floor(Math.random() * HEX_GLYPHS.length)]}
          </motion.span>
        ),
      )}
    </span>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="font-mono flex items-baseline justify-between gap-3 text-[11.5px]">
      <span className="text-[var(--color-ink-3)] uppercase tracking-[0.16em]">{label}</span>
      <span className="text-right text-[var(--color-ink)]">{value}</span>
    </div>
  )
}
