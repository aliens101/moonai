import { ThemeToggle } from '@/components/theme/ThemeToggle'
import Link from 'next/link'

type FooterLink = { label: string; href: string; external?: boolean }
type FooterCol = { label: string; links: FooterLink[] }

// Comprehensive, OpenAI-style sitemap footer — adapted to moonai. Every link
// points at a real route, doc slug, anchor, or external; no placeholder pages.
const COLUMNS: FooterCol[] = [
  {
    label: 'Product',
    links: [
      { label: 'Console', href: '/console' },
      { label: 'Playground', href: '/playground' },
      { label: 'Agents', href: '/console/agents' },
      { label: 'CLI', href: '/docs/cli' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    label: 'Developers',
    links: [
      { label: 'Docs', href: '/docs' },
      { label: 'Quickstart', href: '/docs/quickstart' },
      { label: 'SDK · npm', href: 'https://www.npmjs.com/package/moonai-core', external: true },
      { label: 'Tools & plugins', href: '/docs/tools' },
      { label: 'Research', href: '/research' },
      { label: 'GitHub', href: 'https://github.com/rifkyeasy/moonai', external: true },
    ],
  },
  {
    label: 'Safety',
    links: [
      { label: 'Safety approach', href: '/safety' },
      { label: 'Architecture', href: '/docs/architecture' },
      { label: 'Agent identity', href: '/docs/identity' },
      { label: 'Policy & config', href: '/docs/configuration' },
    ],
  },
  {
    label: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Status', href: '/status' },
      { label: 'Releases', href: 'https://github.com/rifkyeasy/moonai/releases', external: true },
    ],
  },
  {
    label: 'On Sui',
    links: [
      { label: 'Sui', href: 'https://sui.io', external: true },
      { label: 'Cetus', href: 'https://www.cetus.zone', external: true },
      { label: 'NAVI', href: 'https://naviprotocol.io', external: true },
      { label: 'DeFiLlama', href: 'https://defillama.com', external: true },
    ],
  },
]

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-[var(--color-border)] bg-[var(--color-cream)]">
      <div className="mx-auto w-full max-w-[var(--container-wrap)] px-6 pt-20 pb-6 sm:px-8">
        {/* Brand block */}
        <div className="flex flex-col gap-6 border-b border-[var(--color-border)] pb-12 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link
              href="/"
              className="font-wordmark text-[44px] leading-none tracking-[-0.02em] text-[var(--color-ink)]"
            >
              moonai
            </Link>
            <p className="mt-4 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              A policy-aware AI treasury assistant on Sui. The AI advises; deterministic code
              enforces the fund controls.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <IconLink href="https://github.com/rifkyeasy/moonai" label="GitHub">
              <GitHubIcon />
            </IconLink>
            <IconLink href="https://x.com/moonaiai_space" label="X / Twitter">
              <XIcon />
            </IconLink>
          </div>
        </div>

        {/* Sitemap columns */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-10 pt-12 sm:grid-cols-3 lg:grid-cols-5">
          {COLUMNS.map(col => (
            <FooterColumn key={col.label} label={col.label}>
              {col.links.map(link => (
                <FooterRow key={link.label} href={link.href} external={link.external}>
                  {link.label}
                  {link.external ? <span aria-hidden> ↗</span> : null}
                </FooterRow>
              ))}
            </FooterColumn>
          ))}
        </div>

        {/* Bottom bar — Terms & Policies live here, OpenAI-style */}
        <div className="mt-14 flex flex-col gap-6 border-t border-[var(--color-border)] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="font-mono text-[12px] text-[var(--color-ink-3)]">© 2026 · Built by moonai</div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <BottomLink href="/terms">Terms of Use</BottomLink>
            <BottomLink href="/privacy">Privacy Policy</BottomLink>
            <BottomLink href="/policies">Other Policies</BottomLink>
            <ThemeToggle />
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="font-mono mb-4 text-[11px] uppercase tracking-[0.22em] text-[var(--color-ink-3)]">
        {label}
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </div>
  )
}

function FooterRow({
  href,
  external,
  children,
}: {
  href: string
  external?: boolean
  children: React.ReactNode
}) {
  const className =
    'inline-flex items-center py-0.5 text-[14px] text-[var(--color-ink-2)] transition hover:text-[var(--color-ink)]'
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        {children}
      </a>
    )
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  )
}

function BottomLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="font-mono text-[12px] text-[var(--color-ink-3)] transition-colors hover:text-[var(--color-ink-2)]"
    >
      {children}
    </Link>
  )
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-9 w-9 place-items-center rounded-full border border-[var(--color-border)] text-[var(--color-ink-2)] transition-colors hover:border-[var(--color-ink-3)] hover:text-[var(--color-ink)]"
    >
      {children}
    </a>
  )
}

function GitHubIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
    </svg>
  )
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
      <path d="M12.6 0h2.45l-5.36 6.12L16 16h-4.94l-3.87-5.06L2.76 16H.3l5.73-6.55L0 0h5.06l3.5 4.63L12.6 0zm-.86 14.52h1.36L4.32 1.4H2.86l8.88 13.12z" />
    </svg>
  )
}
