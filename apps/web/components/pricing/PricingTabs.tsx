'use client'

import Link from 'next/link'
import { Fragment, useState } from 'react'

// ─────────────────────────── types ───────────────────────────

type Cta = { label: string; href?: string; soon: boolean }
type Plan = {
  id: string
  name: string
  price: string
  period: string
  tagline: string
  highlight?: boolean
  cta: Cta
  bullets: string[]
}
type Row = { label: string; values: Array<string | boolean> }
type Group = { name: string; rows: Row[] }
type TabId = 'individual' | 'team' | 'api'

// ─────────────────────────── tab data ───────────────────────────

const TABS: Array<{ id: TabId; label: string; blurb: string }> = [
  { id: 'individual', label: 'Individual', blurb: 'For one person running a treasury.' },
  { id: 'team', label: 'Team', blurb: 'For DAOs, funds & multisig treasuries.' },
  { id: 'api', label: 'API & SDK', blurb: 'Build moonai into your own product.' },
]

const INDIVIDUAL_PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    tagline: 'Self-serve. Bring your own LLM key.',
    cta: { label: 'Open console', href: '/console', soon: false },
    bullets: ['Unlimited reads & simulation', 'Manual signing', 'CLI · console · SDK'],
  },
  {
    id: 'plus',
    name: 'Plus',
    price: '$19',
    period: '/ month',
    tagline: 'For individuals running a live treasury.',
    highlight: true,
    cta: { label: 'Coming soon', soon: true },
    bullets: ['Bundled frontier model', 'Agent wallet + light autonomy', 'Telegram bot'],
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$49',
    period: '/ month',
    tagline: 'Power users and active on-chain traders.',
    cta: { label: 'Coming soon', soon: true },
    bullets: ['5× the usage ceiling', 'Full 24/7 autonomy', 'Multi-agent + audit log'],
  },
]

const INDIVIDUAL_GROUPS: Group[] = [
  {
    name: 'Intelligence',
    rows: [
      { label: 'Chat, portfolio & yield reads', values: ['Unlimited', 'Unlimited', 'Unlimited'] },
      { label: 'AI model', values: ['Standard', 'Frontier', 'Frontier + priority'] },
      { label: 'Agent runs', values: ['25 / day', '~1,500 / mo', '5× Plus'] },
      { label: 'Bring your own LLM key', values: [true, true, true] },
    ],
  },
  {
    name: 'Execution',
    rows: [
      { label: 'Transaction simulation', values: [true, true, true] },
      { label: 'Policy controls & approvals', values: [true, true, true] },
      { label: 'Derived agent wallet', values: [true, true, true] },
      { label: '24/7 autonomy (gateway)', values: [false, 'Light', 'Full'] },
      { label: 'Swap / routing fee', values: ['0.30%', '0.20%', '0.15%'] },
    ],
  },
  {
    name: 'Surfaces',
    rows: [
      { label: 'Web console + CLI + SDK', values: [true, true, true] },
      { label: 'Telegram bot', values: [false, true, true] },
      { label: 'Multi-agent', values: [false, false, true] },
      { label: 'Audit log & export', values: [false, false, true] },
      { label: 'Support', values: ['Community', 'Email', 'Priority'] },
    ],
  },
]

const TEAM_PLANS: Plan[] = [
  {
    id: 'team',
    name: 'Team',
    price: '$39',
    period: '/ seat · mo',
    tagline: 'DAOs and shared treasuries. Min. 3 seats.',
    highlight: true,
    cta: { label: 'Coming soon', soon: true },
    bullets: ['Multisig policy & approvals', 'Seats, SSO & roles', '0.10% execution fee'],
  },
  {
    id: 'enterprise',
    name: 'Enterprise · Managed',
    price: 'Custom',
    period: 'AUM + platform fee',
    tagline: 'Funds and large DAOs. Managed or self-host.',
    cta: { label: 'Talk to us · soon', soon: true },
    bullets: ['Inference at cost + AUM fee', 'Self-host / on-prem · SLA', 'Dedicated policy review'],
  },
]

const TEAM_GROUPS: Group[] = [
  {
    name: 'Everything in Pro, plus',
    rows: [
      { label: 'Seats', values: ['Per seat (min 3)', 'Unlimited'] },
      { label: 'SSO, roles & SCIM', values: [true, '+ SCIM'] },
      { label: 'Multisig policy & approvals', values: [true, true] },
      { label: 'Audit log & export', values: [true, true] },
    ],
  },
  {
    name: 'Scale & trust',
    rows: [
      { label: '24/7 autonomy (gateway)', values: ['Full', 'Full + dedicated'] },
      { label: 'Swap / routing fee', values: ['0.10%', '0% / negotiated'] },
      { label: 'Managed treasury (AUM + perf fee)', values: [false, true] },
      { label: 'Self-host / on-prem', values: [false, true] },
      { label: 'SLA', values: [false, true] },
      { label: 'Support', values: ['Priority', 'Dedicated + onboarding'] },
    ],
  },
]

// ─────────────────────────── component ───────────────────────────

export function PricingTabs() {
  const [tab, setTab] = useState<TabId>('individual')
  const active = TABS.find(t => t.id === tab) ?? TABS[0]

  return (
    <div className="mt-12">
      {/* Segmented tab control */}
      <div className="flex flex-col items-center gap-3">
        <div className="inline-flex rounded-full border border-[var(--color-border-strong)] bg-[var(--color-paper)] p-1">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-pressed={tab === t.id}
              className={`rounded-full px-4 py-1.5 text-[13.5px] font-medium transition-colors sm:px-6 ${
                tab === t.id
                  ? 'bg-[var(--color-ink)] text-[var(--color-cream)]'
                  : 'text-[var(--color-ink-2)] hover:text-[var(--color-ink)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-[13px] text-[var(--color-ink-3)]">{active.blurb}</p>
      </div>

      {/* Tab body */}
      <div className="mt-10">
        {tab === 'individual' ? (
          <PlanPanel plans={INDIVIDUAL_PLANS} groups={INDIVIDUAL_GROUPS} cols={3} />
        ) : null}
        {tab === 'team' ? <PlanPanel plans={TEAM_PLANS} groups={TEAM_GROUPS} cols={2} /> : null}
        {tab === 'api' ? <ApiPanel /> : null}
      </div>
    </div>
  )
}

function PlanPanel({ plans, groups, cols }: { plans: Plan[]; groups: Group[]; cols: 2 | 3 }) {
  const gridCols = cols === 3 ? 'lg:grid-cols-3' : 'sm:grid-cols-2'
  const minW = cols === 3 ? 'min-w-[640px]' : 'min-w-[520px]'
  return (
    <>
      <div className={`grid grid-cols-1 gap-4 ${gridCols}`}>
        {plans.map(plan => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>

      <div className="mt-12 overflow-x-auto">
        <table className={`w-full ${minW} border-collapse text-left`}>
          <thead>
            <tr>
              <th className="w-[36%] pb-4 align-bottom font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--color-ink-3)]">
                Compare
              </th>
              {plans.map(plan => (
                <th
                  key={plan.id}
                  className={`pb-4 align-bottom ${plan.highlight ? 'rounded-t-xl bg-[var(--color-cream-deep)]' : ''}`}
                >
                  <div className="px-3">
                    <div className="text-[15px] font-semibold text-[var(--color-ink)]">
                      {plan.name}
                    </div>
                    <div className="mt-0.5 text-[12.5px] text-[var(--color-ink-3)]">
                      {plan.price}
                      <span className="text-[11px]"> {plan.period}</span>
                    </div>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <Fragment key={group.name}>
                <tr>
                  <td
                    colSpan={plans.length + 1}
                    className="border-t border-[var(--color-border-strong)] pt-6 pb-2 font-mono text-[10.5px] uppercase tracking-[0.2em] text-[var(--color-ink-2)]"
                  >
                    {group.name}
                  </td>
                </tr>
                {group.rows.map(row => (
                  <tr key={row.label} className="border-t border-[var(--color-border)]">
                    <td className="py-3 pr-4 text-[13.5px] text-[var(--color-ink-2)]">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td
                        key={plans[i].id}
                        className={`px-3 py-3 text-center text-[13.5px] ${
                          plans[i].highlight ? 'bg-[var(--color-cream-deep)]' : ''
                        }`}
                      >
                        <Cell v={v} />
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
            <tr>
              <td className="pt-6" />
              {plans.map(plan => (
                <td
                  key={plan.id}
                  className={`px-3 pt-6 pb-5 text-center ${
                    plan.highlight ? 'rounded-b-xl bg-[var(--color-cream-deep)]' : ''
                  }`}
                >
                  <PlanCta plan={plan} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </>
  )
}

function ApiPanel() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      {/* SDK — real, shippable today */}
      <div className="flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-paper)] p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
          SDK
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className="font-display text-[40px] font-light leading-none tracking-tight text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            Free
          </span>
          <span className="text-[13px] text-[var(--color-ink-3)]">open source</span>
        </div>
        <p className="mt-3 text-[13.5px] leading-snug text-[var(--color-ink-2)]">
          Embed the policy engine, tool registry, and on-chain moonai::policy in your own agent.
          Bring your own LLM key.
        </p>
        <Link
          href="https://www.npmjs.com/package/moonai-core"
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
        >
          View packages <span aria-hidden>↗</span>
        </Link>
        <ul className="mt-6 flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-5">
          {['Deterministic policy + approval spine', 'Plugin host & tool registry', 'On-chain policy (moonai::policy)'].map(
            b => (
              <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--color-ink-2)]">
                <Check />
                <span>{b}</span>
              </li>
            ),
          )}
        </ul>
      </div>

      {/* Hosted API — usage based, coming soon */}
      <div className="flex flex-col rounded-2xl border border-[var(--color-border-strong)] bg-[var(--color-paper)] p-6 shadow-[var(--shadow-card)]">
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
          Hosted API
        </div>
        <div className="mt-3 flex items-baseline gap-1.5">
          <span
            className="font-display text-[40px] font-light leading-none tracking-tight text-[var(--color-ink)]"
            style={{ fontVariationSettings: '"opsz" 96' }}
          >
            Usage
          </span>
          <span className="text-[13px] text-[var(--color-ink-3)]">pay as you go</span>
        </div>
        <p className="mt-3 text-[13.5px] leading-snug text-[var(--color-ink-2)]">
          A metered endpoint for agent runs and policy-checked execution — no servers to run.
        </p>
        <button
          type="button"
          disabled
          aria-disabled="true"
          title="Hosted API is coming soon"
          className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-transparent px-4 py-2.5 text-[13.5px] font-medium text-[var(--color-ink-3)]"
        >
          Coming soon
        </button>
        <dl className="mt-6 flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-5 text-[13px]">
          <UsageRow term="Agent runs">from $2 / 1k runs</UsageRow>
          <UsageRow term="Execution fee">0.15% on routed swaps</UsageRow>
          <UsageRow term="On-chain policy object">included</UsageRow>
          <UsageRow term="Bring your own key">supported · inference at cost</UsageRow>
        </dl>
      </div>
    </div>
  )
}

function UsageRow({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-[var(--color-ink-2)]">{term}</dt>
      <dd className="font-mono text-[12.5px] text-[var(--color-ink)]">{children}</dd>
    </div>
  )
}

function PlanCard({ plan }: { plan: Plan }) {
  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-6 ${
        plan.highlight
          ? 'border-[var(--color-border-strong)] bg-[var(--color-paper)] shadow-[var(--shadow-card)]'
          : 'border-[var(--color-border)] bg-[var(--color-paper)]'
      }`}
    >
      {plan.highlight ? (
        <span className="absolute -top-2.5 left-6 rounded-full bg-[var(--color-ink)] px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--color-cream)]">
          Most popular
        </span>
      ) : null}
      <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--color-ink-3)]">
        {plan.name}
      </div>
      <div className="mt-3 flex items-baseline gap-1.5">
        <span
          className="font-display text-[40px] font-light leading-none tracking-tight text-[var(--color-ink)]"
          style={{ fontVariationSettings: '"opsz" 96' }}
        >
          {plan.price}
        </span>
        <span className="text-[13px] text-[var(--color-ink-3)]">{plan.period}</span>
      </div>
      <p className="mt-3 min-h-[40px] text-[13.5px] leading-snug text-[var(--color-ink-2)]">
        {plan.tagline}
      </p>
      <div className="mt-5">
        <PlanCta plan={plan} />
      </div>
      <ul className="mt-6 flex flex-col gap-2.5 border-t border-[var(--color-border)] pt-5">
        {plan.bullets.map(b => (
          <li key={b} className="flex items-start gap-2 text-[13px] text-[var(--color-ink-2)]">
            <Check />
            <span>{b}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PlanCta({ plan }: { plan: Plan }) {
  if (!plan.cta.soon && plan.cta.href) {
    return (
      <Link
        href={plan.cta.href}
        className="inline-flex w-full items-center justify-center gap-1.5 rounded-full bg-[var(--color-ink)] px-4 py-2.5 text-[13.5px] font-medium text-[var(--color-cream)] transition-transform hover:-translate-y-[1px]"
      >
        {plan.cta.label} <span aria-hidden>→</span>
      </Link>
    )
  }
  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Subscriptions are coming soon"
      className="inline-flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-[var(--color-border-strong)] bg-transparent px-4 py-2.5 text-[13.5px] font-medium text-[var(--color-ink-3)]"
    >
      {plan.cta.label}
    </button>
  )
}

function Cell({ v }: { v: string | boolean }) {
  if (v === true) return <Check className="mx-auto" />
  if (v === false) return <span className="text-[var(--color-ink-3)]">—</span>
  return <span className="text-[var(--color-ink)]">{v}</span>
}

function Check({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 16 16"
      role="img"
      aria-label="included"
      className={`h-3.5 w-3.5 shrink-0 text-[var(--color-ink)] ${className}`}
      fill="none"
    >
      <title>included</title>
      <path
        d="M3 8.5l3.2 3.2L13 4.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
