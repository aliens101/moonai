import { Footer } from '@/components/Footer'
import { SubNavbar } from '@/components/SubNavbar'
import Link from 'next/link'

export const metadata = {
  title: 'Solutions · moonai',
  description:
    'moonai for individuals, teams & DAOs, and funds. Policy-aware AI treasury management on Sui — from a single power user to a multisig treasury under formal controls.',
}

const SEGMENTS = [
  {
    id: 'individuals',
    eyebrow: 'For individuals',
    title: 'Run your treasury by chat',
    body: 'Ask for yields, simulate a swap on Cetus, rebalance, lend on NAVI or Suilend — and execute from your own wallet or a derived agent wallet. Every write is simulated and capped, so a power user moves fast without footguns.',
    points: ['Console, CLI & Telegram', 'Derived agent wallet', 'Bring your own LLM key'],
    cta: 'Start free',
    href: '/pricing',
  },
  {
    id: 'teams',
    eyebrow: 'For teams & DAOs',
    title: 'Shared treasury under policy',
    body: 'Give a DAO or team a single agent with multisig-aware approvals, per-member roles, allowlists and daily caps, an audit log, and 24/7 autonomy inside a pre-authorized envelope.',
    points: ['Multisig policy & approvals', 'Seats, SSO & roles', 'Audit log & export'],
    cta: 'See Team pricing',
    href: '/pricing',
  },
  {
    id: 'funds',
    eyebrow: 'For funds',
    title: 'Managed, with a track record',
    body: 'Inference at cost, an AUM-based fee, optional performance fee, self-host or on-prem, dedicated policy review, and an SLA — backed by a verifiable on-chain history of policy-checked PTBs and Walrus receipts.',
    points: ['Custom policy & limits', 'Self-host / on-prem · SLA', 'Verifiable track record'],
    cta: 'Talk to us',
    href: '/pricing',
  },
]

export default function SolutionsPage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <SubNavbar label="solutions" />
      <div className="mx-auto w-full max-w-[var(--container-wrap)] px-6 pb-24 pt-28 sm:px-8 md:pt-32">
        <header className="flex max-w-[64ch] flex-col gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
            Solutions
          </span>
          <h1
            className="font-display text-[clamp(38px,5vw,68px)] font-light leading-[1.04] tracking-[-0.018em] text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 0' }}
          >
            One agent. Every treasury.
          </h1>
          <p className="text-[16px] leading-relaxed text-[var(--color-ink-2)]">
            From a single power user to a multisig DAO treasury to a managed fund — the same
            policy-aware engine, scaled to the controls each one needs.
          </p>
        </header>

        <div className="mt-14 flex flex-col gap-4">
          {SEGMENTS.map(s => (
            <section
              key={s.id}
              id={s.id}
              className="grid scroll-mt-28 grid-cols-1 gap-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-8 md:grid-cols-[1.4fr_1fr]"
            >
              <div>
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
                  {s.eyebrow}
                </div>
                <h2
                  className="mt-2 font-display text-[clamp(24px,2.8vw,32px)] font-light tracking-tight text-[var(--color-ink)]"
                  style={{ fontVariationSettings: '"opsz" 72' }}
                >
                  {s.title}
                </h2>
                <p className="mt-3 max-w-[52ch] text-[14.5px] leading-relaxed text-[var(--color-ink-2)]">
                  {s.body}
                </p>
                <Link
                  href={s.href}
                  className="mt-5 inline-flex rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
                >
                  {s.cta} →
                </Link>
              </div>
              <ul className="flex flex-col justify-center gap-2.5 border-t border-[var(--color-border)] pt-5 md:border-l md:border-t-0 md:pl-6 md:pt-0">
                {s.points.map(p => (
                  <li key={p} className="text-[13.5px] text-[var(--color-ink-2)]">
                    {p}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
      <Footer />
    </main>
  )
}
