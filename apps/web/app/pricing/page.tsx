import { Footer } from '@/components/Footer'
import { PricingTabs } from '@/components/pricing/PricingTabs'
import Link from 'next/link'

export const metadata = {
  title: 'Pricing · moonai',
  description:
    'Plans for moonai, the policy-aware AI treasury agent on Sui. Start free, bring your own LLM key, and pay only for execution. Subscriptions are coming soon.',
}

export default function PricingPage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <PricingNavbar />
      <div className="mx-auto w-full max-w-[var(--container-wrap)] px-6 pb-24 pt-28 sm:px-8 md:pt-32">
        <Header />
        <PricingTabs />
        <FeeNote />
      </div>
      <Footer />
    </main>
  )
}

function PricingNavbar() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-[var(--color-cream)]/85 pt-5 backdrop-blur-md sm:pt-6">
      <div className="mx-auto flex h-[56px] w-full max-w-[var(--container-wrap)] items-center justify-between px-6 sm:px-8">
        <Link
          href="/"
          className="font-wordmark text-[24px] leading-none tracking-[-0.02em] text-[var(--color-ink)]"
          aria-label="moonai home"
        >
          moonai<span className="text-[var(--color-ink-3)]"> · pricing</span>
        </Link>
        <nav className="flex items-center gap-5" aria-label="pricing">
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

function Header() {
  return (
    <header className="flex flex-col items-center gap-5 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-[var(--color-border-strong)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-2)]">
        <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-ink-3)]" />
        Pricing preview · plans go live soon
      </span>
      <h1
        className="font-display text-[clamp(40px,5.5vw,76px)] font-light leading-[1.03] tracking-[-0.018em] text-[var(--color-ink)]"
        style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 0' }}
      >
        Start free. Pay for execution.
      </h1>
      <p className="max-w-[62ch] text-[16px] leading-relaxed text-[var(--color-ink-2)]">
        moonai is free to run today — bring your own LLM key and the agent reads, simulates, and
        signs from your own wallet. Subscriptions add bundled intelligence, autonomy, and lower
        on-chain fees. They&rsquo;re on the way.
      </p>
    </header>
  )
}

function FeeNote() {
  return (
    <div className="mt-16 grid grid-cols-1 gap-x-10 gap-y-4 border-t border-[var(--color-border)] pt-8 sm:grid-cols-2">
      <FeeItem title="Bring your own key">
        On every plan you can supply your own OpenAI / OpenRouter / Anthropic key, so inference is at
        cost — the subscription then covers autonomy, surfaces, and a lower execution fee.
      </FeeItem>
      <FeeItem title="Execution fee">
        A small fee on swaps the agent routes for you, tiered down as you upgrade. Reads, simulations,
        and transfers from your own wallet are never charged.
      </FeeItem>
      <FeeItem title="No custody">
        moonai never holds your funds. The agent proposes; policy gates; you (or your multisig) sign.
        Cancel anytime — your wallet and keys stay yours.
      </FeeItem>
      <FeeItem title="Preview pricing">
        Numbers here are indicative while plans are in preview and may change before launch. Today the
        Free tier is fully usable — open the console and connect a wallet.
      </FeeItem>
    </div>
  )
}

function FeeItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[13.5px] font-semibold text-[var(--color-ink)]">{title}</div>
      <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-ink-2)]">{children}</p>
    </div>
  )
}
