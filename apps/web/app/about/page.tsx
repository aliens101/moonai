import { Footer } from '@/components/Footer'
import { SubNavbar } from '@/components/SubNavbar'
import Link from 'next/link'

export const metadata = {
  title: 'About · moonai',
  description:
    'moonai is a policy-aware AI treasury assistant on Sui. The AI advises; deterministic code enforces the fund controls. Our mission is autonomy you can actually trust with money.',
}

const FACTS = [
  { k: 'Network', v: 'Sui — execution & settlement' },
  { k: 'Identity', v: 'Sui address — agent keypair' },
  { k: 'Custody', v: 'Non-custodial · client-signed' },
  { k: 'Surfaces', v: 'Console · CLI · SDK · Telegram' },
]

export default function AboutPage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <SubNavbar label="about" />
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-6 pb-24 pt-28 sm:px-8 md:pt-32">
        <header className="flex flex-col gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
            About
          </span>
          <h1
            className="font-display text-[clamp(38px,5vw,68px)] font-light leading-[1.04] tracking-[-0.018em] text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 0' }}
          >
            The AI advises. Code enforces.
          </h1>
          <p className="max-w-[64ch] text-[16px] leading-relaxed text-[var(--color-ink-2)]">
            moonai is a policy-aware AI treasury assistant on Sui. It does real on-chain work —
            reading, analysing, swapping, lending, transferring — but every value-moving action runs
            through policy, simulation, and approval before it broadcasts.
          </p>
        </header>

        <section className="mt-14 flex flex-col gap-5 text-[15.5px] leading-relaxed text-[var(--color-ink-2)]">
          <p>
            Most “AI agents” for crypto are chat wrappers that either can’t touch funds or touch them
            with no real guardrails. We think the interesting problem is the opposite: give the agent
            genuine capability, then make it <em>structurally</em> unable to do the wrong thing.
          </p>
          <p>
            So moonai splits the work. The model is advisory — it proposes typed intents and explains
            its reasoning, but it never holds keys. The controls are deterministic code and the
            on-chain <code>moonai::policy</code> Move package: allowlists, caps, slippage and
            health-factor floors, RWA eligibility, simulation, and human approval for anything
            material. A wrong or jailbroken model still can’t breach a limit.
          </p>
          <p>
            Identity is a Sui address. Each agent is just a Sui keypair, and its on-chain history —
            policy-checked PTBs and Walrus-anchored receipts — gives it a verifiable track record, so
            trust is checked, not claimed. That’s what we mean by verifiable autonomy.
          </p>
        </section>

        <section className="mt-12 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)] sm:grid-cols-2">
          {FACTS.map(f => (
            <div key={f.k} className="bg-[var(--color-paper)] px-6 py-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
                {f.k}
              </div>
              <div className="mt-1 text-[15px] text-[var(--color-ink)]">{f.v}</div>
            </div>
          ))}
        </section>

        <section className="mt-12 flex flex-wrap gap-3">
          <Link
            href="/console"
            className="rounded-full bg-[var(--color-ink)] px-5 py-2.5 text-[13.5px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
          >
            Open the console →
          </Link>
          <Link
            href="/safety"
            className="rounded-full border border-[var(--color-border-strong)] px-5 py-2.5 text-[13.5px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink-3)]"
          >
            How we keep it safe
          </Link>
        </section>
      </div>
      <Footer />
    </main>
  )
}
