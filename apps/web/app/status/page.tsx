import { Footer } from '@/components/Footer'
import { StatusBoard } from '@/components/status/StatusBoard'
import Link from 'next/link'

export const metadata = {
  title: 'Status · moonai',
  description: 'Live status of the moonai console, API, and the Sui network it runs on.',
}

export default function StatusPage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <StatusNavbar />
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-6 pb-24 pt-28 sm:px-8 md:pt-32">
        <header className="flex flex-col gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
            System status
          </span>
          <h1
            className="font-display text-[clamp(34px,4.5vw,56px)] font-light leading-[1.05] tracking-[-0.018em] text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 84, "SOFT" 24' }}
          >
            Is moonai up?
          </h1>
          <p className="max-w-[60ch] text-[15px] leading-relaxed text-[var(--color-ink-2)]">
            Live health of the console, API, and the chains moonai reads and settles on. Checks run
            from your browser, so this reflects what you can actually reach right now.
          </p>
        </header>
        <StatusBoard />
      </div>
      <Footer />
    </main>
  )
}

function StatusNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[var(--color-cream)]/85 pt-5 backdrop-blur-md sm:pt-6">
      <div className="mx-auto flex h-[56px] w-full max-w-[var(--container-wrap)] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-wordmark text-[24px] leading-none tracking-[-0.02em] text-[var(--color-ink)]"
          aria-label="moonai home"
        >
          moonai<span className="text-[var(--color-ink-3)]"> · status</span>
        </Link>
        <Link
          href="/console"
          className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
        >
          Open console <span aria-hidden>→</span>
        </Link>
      </div>
    </header>
  )
}
