'use client'

// A success/error result dialog shown after any owner transaction in the console
// (provision, deposit, withdraw, gas top-up, payee allowlist). Confirms the action
// landed on-chain and links the digest to the explorer.
import { txUrl } from '@/lib/chainscan'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export type TxResult = {
  kind: 'success' | 'error'
  label: string
  digest?: string
  error?: string
}

export function TxResultDialog({ result, onClose }: { result: TxResult | null; onClose: () => void }) {
  useEffect(() => {
    if (!result) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [result, onClose])

  if (!result || typeof document === 'undefined') return null
  const ok = result.kind === 'success'

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[rgba(11,14,21,0.55)] p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-6 text-center shadow-[var(--shadow-card)]"
        onClick={e => e.stopPropagation()}
      >
        <div
          className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-[26px] ${
            ok ? 'bg-[rgba(43,143,255,0.12)] text-[var(--color-accent)]' : 'bg-[rgba(214,60,60,0.12)] text-[#d63c3c]'
          }`}
        >
          {ok ? '✓' : '✕'}
        </div>
        <h2 className="mt-4 font-display text-[20px] text-[var(--color-ink)]">
          {ok ? 'Transaction successful' : 'Transaction failed'}
        </h2>
        <p className="mt-1 text-[13px] capitalize text-[var(--color-ink-2)]">{result.label}</p>

        {ok && result.digest ? (
          <a
            href={txUrl(result.digest, 'mainnet')}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] px-3.5 py-1.5 font-mono text-[12px] text-[var(--color-accent)] transition-colors hover:border-[var(--color-accent)]"
          >
            {result.digest.slice(0, 10)}…{result.digest.slice(-6)} ↗
          </a>
        ) : null}
        {!ok && result.error ? (
          <p className="mt-4 max-h-32 overflow-auto rounded-lg bg-[var(--color-cream-deep)] p-3 text-left font-mono text-[12px] text-[var(--color-ink-2)]">
            {result.error}
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-full bg-[var(--color-accent)] px-5 py-2.5 text-[14px] font-medium text-white transition-colors hover:bg-[var(--color-accent-deep)]"
        >
          Done
        </button>
      </div>
    </div>,
    document.body,
  )
}
