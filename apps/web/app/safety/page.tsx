import { Footer } from '@/components/Footer'
import { SubNavbar } from '@/components/SubNavbar'
import Link from 'next/link'

export const metadata = {
  title: 'Safety · moonai',
  description:
    'How moonai keeps an autonomous agent safe with treasury funds: the AI only advises, deterministic code enforces, every write is simulated and gated by the on-chain moonai::policy Move package, and identity is a verifiable Sui address.',
}

const GATES = [
  {
    n: '01',
    title: 'Policy',
    body: 'Every value-moving intent is checked against deterministic rules in the on-chain moonai::policy Move package — allowlists, per-coin and daily caps, slippage and health-factor floors, RWA eligibility. Violations are rejected before anything is signed.',
  },
  {
    n: '02',
    title: 'Simulate',
    body: 'The PTB is dry-run against live Sui state first. If it would abort, move more than expected, or breach a limit, it never reaches your wallet.',
  },
  {
    n: '03',
    title: 'Approve',
    body: 'Material-risk actions require explicit human approval. Low-risk actions can run inside a pre-authorized envelope; anything outside it asks you (or your multisig) to confirm.',
  },
  {
    n: '04',
    title: 'Execute',
    body: 'Only then does it broadcast on Sui — signed by the wallet you chose for that action — returning a tx digest and emitting an auditable receipt, anchored in Walrus, of what was decided and why.',
  },
]

const PRINCIPLES = [
  {
    title: 'The AI advises; code enforces',
    body: 'The model proposes typed intents. It never holds keys and cannot move funds on its own. The guardrails are deterministic code and the on-chain moonai::policy Move package, not prompts — so a wrong or jailbroken model still cannot break a limit.',
  },
  {
    title: 'No custody',
    body: 'moonai never holds your funds. You connect a wallet (or derive an agent wallet you control); signing happens client-side. There is no server-side key for the public console.',
  },
  {
    title: 'Verifiable identity',
    body: 'Each agent is a Sui address (keypair). Its on-chain history of policy-checked PTBs and Walrus-anchored receipts forms a track record that can be checked, not just claimed.',
  },
  {
    title: 'Bounded autonomy',
    body: 'Autonomy is opt-in and capped. Leverage and hedging are strictly bounded. You set the envelope; moonai acts only inside it and escalates the rest to you.',
  },
]

export default function SafetyPage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <SubNavbar label="safety" />
      <div className="mx-auto w-full max-w-[var(--container-narrow)] px-6 pb-24 pt-28 sm:px-8 md:pt-32">
        <header className="flex flex-col gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
            Safety approach
          </span>
          <h1
            className="font-display text-[clamp(38px,5vw,68px)] font-light leading-[1.04] tracking-[-0.018em] text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 0' }}
          >
            Autonomy you can verify.
          </h1>
          <p className="max-w-[64ch] text-[16px] leading-relaxed text-[var(--color-ink-2)]">
            Letting an AI near a treasury is only acceptable if it can’t do the wrong thing. moonai’s
            answer is to keep the AI advisory and put every fund-moving action through four
            deterministic gates before it can ever broadcast.
          </p>
        </header>

        {/* The four gates */}
        <section className="mt-16">
          <h2
            className="font-display text-[clamp(24px,3vw,34px)] font-light tracking-tight text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 72, "SOFT" 20' }}
          >
            The four-gate write pipeline
          </h2>
          <div className="mt-8 flex flex-col gap-px overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-border)]">
            {GATES.map(g => (
              <div key={g.n} className="flex gap-5 bg-[var(--color-paper)] px-6 py-5">
                <div className="font-mono text-[13px] text-[var(--color-ink-3)]">{g.n}</div>
                <div>
                  <div className="text-[16px] font-semibold text-[var(--color-ink)]">{g.title}</div>
                  <p className="mt-1.5 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
                    {g.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Principles */}
        <section className="mt-16">
          <h2
            className="font-display text-[clamp(24px,3vw,34px)] font-light tracking-tight text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 72, "SOFT" 20' }}
          >
            Principles
          </h2>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PRINCIPLES.map(p => (
              <div
                key={p.title}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-6"
              >
                <div className="text-[15px] font-semibold text-[var(--color-ink)]">{p.title}</div>
                <p className="mt-2 text-[14px] leading-relaxed text-[var(--color-ink-2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-8">
          <p className="text-[15px] leading-relaxed text-[var(--color-ink-2)]">
            Want the technical detail — the moonai::policy Move package, simulation, and how Sui-address
            identity works?
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/docs/architecture"
              className="rounded-full bg-[var(--color-ink)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
            >
              Read the architecture →
            </Link>
            <Link
              href="/docs/identity"
              className="rounded-full border border-[var(--color-border-strong)] px-4 py-2 text-[13.5px] font-medium text-[var(--color-ink)] transition-colors hover:border-[var(--color-ink-3)]"
            >
              Sui identity
            </Link>
          </div>
        </section>
      </div>
      <Footer />
    </main>
  )
}
