import { Footer } from '@/components/Footer'
import { SubNavbar } from '@/components/SubNavbar'
import Link from 'next/link'

const POLICY_LINKS = [
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Other Policies', href: '/policies' },
]

export function LegalShell({
  label,
  title,
  updated,
  intro,
  children,
}: {
  label: string
  title: string
  updated: string
  intro: string
  children: React.ReactNode
}) {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <SubNavbar label={label} />
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-6 pb-24 pt-28 sm:px-8 md:pt-32">
        <header className="flex flex-col gap-3 border-b border-[var(--color-border)] pb-8">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
            Terms &amp; Policies
          </span>
          <h1
            className="font-display text-[clamp(32px,4vw,52px)] font-light leading-[1.05] tracking-[-0.018em] text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 84, "SOFT" 24' }}
          >
            {title}
          </h1>
          <p className="font-mono text-[12px] text-[var(--color-ink-3)]">Last updated {updated}</p>
          <p className="mt-2 max-w-[68ch] text-[15px] leading-relaxed text-[var(--color-ink-2)]">
            {intro}
          </p>
        </header>

        {/* Cross-links between the policy documents */}
        <nav className="mt-6 flex flex-wrap gap-2" aria-label="policies">
          {POLICY_LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full border border-[var(--color-border)] px-3 py-1.5 text-[12.5px] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="mt-10 flex flex-col gap-9">{children}</div>

        <p className="mt-12 border-t border-[var(--color-border)] pt-6 text-[13px] leading-relaxed text-[var(--color-ink-3)]">
          This document is provided for transparency and may be updated as the product evolves. It is
          not legal advice. Questions? Reach us at{' '}
          <a
            href="https://x.com/moonaiai_space"
            target="_blank"
            rel="noreferrer"
            className="underline transition-colors hover:text-[var(--color-ink)]"
          >
            @moonaiai_space
          </a>
          .
        </p>
      </div>
      <Footer />
    </main>
  )
}

export function LegalSection({
  heading,
  children,
}: {
  heading: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-[16px] font-semibold text-[var(--color-ink)]">{heading}</h2>
      <div className="flex flex-col gap-2 text-[14.5px] leading-relaxed text-[var(--color-ink-2)]">
        {children}
      </div>
    </section>
  )
}
