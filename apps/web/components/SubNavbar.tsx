import Link from 'next/link'

// Lightweight fixed navbar for standalone content pages (safety, about,
// solutions, legal, status…). The landing Navbar's scroll-morph is tied to a
// #hero element these pages don't have, so they use this instead.
export function SubNavbar({ label }: { label: string }) {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[var(--color-cream)]/85 pt-5 backdrop-blur-md sm:pt-6">
      <div className="mx-auto flex h-[56px] w-full max-w-[var(--container-wrap)] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-wordmark text-[24px] leading-none tracking-[-0.02em] text-[var(--color-ink)]"
          aria-label="moonai home"
        >
          moonai<span className="text-[var(--color-ink-3)]"> · {label}</span>
        </Link>
        <nav className="flex items-center gap-5" aria-label={label}>
          <Link
            href="/docs"
            className="hidden text-[14px] font-medium text-[var(--color-ink)] transition-colors hover:text-[var(--color-ink-2)] sm:inline"
          >
            Docs
          </Link>
          <Link
            href="/console"
            className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
          >
            Open console <span aria-hidden>→</span>
          </Link>
        </nav>
      </div>
    </header>
  )
}
