/**
 * 4 hero cycles. Each cycle has:
 * - surface: TUI vs TG (drives chat aesthetic)
 * - prompt: the natural-language operator prompt
 * - tool stream: ordered list of tool calls + their result indicators
 * - reply: bot's final reply
 * - artifact: the output canvas card type
 * - painting: which Aurelia wash for the canvas backdrop
 * - greeting (TG only): optional warmup turn before the main exchange
 */

export type CycleSurface = 'tui' | 'tg'
export type ToolStreamEntry = { tool: string; args?: string; status: 'ok' | 'failed' }

export type ResearchCard = {
  type: 'research'
  title: string
  sources: Array<{ name: string; url: string; preview: string }>
}
export type SwapCard = {
  type: 'swap'
  fromAmount: string
  fromSymbol: string
  toAmount: string
  toSymbol: string
  txHash: string
  newBalance: string
}
export type AuditCard = {
  type: 'audit'
  jobId: string
  agent: string
  bidAmount: string
  status: string
  reportHash: string
  txHash: string
}
export type StakeCard = {
  type: 'stake'
  position: string
  validator: string
  apr: string
  unlockBlock: number
  txHash: string
}

export type CycleArtifact = ResearchCard | SwapCard | AuditCard | StakeCard

export type CycleGreeting = { prompt: string; reply: string }

export type Cycle = {
  id: string
  surface: CycleSurface
  greeting?: CycleGreeting
  prompt: string
  toolStream: ToolStreamEntry[]
  reply: string
  artifact: CycleArtifact
  painting: '1' | '2' | '3' | '4'
  durationMs: number
}

export const CYCLES: Cycle[] = [
  // ─── Cycle 1 , TUI · deep research on Sui ────────────────────────────────
  {
    id: 'research',
    surface: 'tui',
    prompt:
      'find the best stablecoin yield on Sui and flag anything restricted',
    toolStream: [
      { tool: 'defi.yields', args: 'Sui · stablecoin', status: 'ok' },
      { tool: 'coins.info', args: 'top pools', status: 'ok' },
      { tool: 'web.fetch', args: 'defillama.com/chain/sui', status: 'ok' },
      { tool: 'object.read', args: 'pool introspection', status: 'ok' },
      { tool: 'walrus.store', args: 'yield scan', status: 'ok' },
    ],
    reply: `Pulled Sui stablecoin pools from DeFiLlama (discovery only, no execution):

**Suilend · USDC** , supply APY ~4.6%, deep liquidity, blue-chip risk. Reachable via suilend.supply.

**Cetus · USDC/USDT** , LP APY ~7.2%, higher variance, impermanent-loss exposure.

**Restricted (RWA)** , USDY, OUSG, and BUIDL show attractive headline yields but are flagged: eligibility-gated products. I will not propose entering these without explicit confirmation that you qualify.

Recommendation: Suilend USDC for a low-risk allocation. Say the word and I will run it through policy, dry-run it, and ask for approval before anything moves.`,
    artifact: {
      type: 'research',
      title: 'Sui yields · field report',
      sources: [
        { name: 'defillama.com', url: 'https://defillama.com', preview: 'Sui pools · APY / TVL' },
        { name: 'suilend.fi', url: 'https://suilend.fi', preview: 'Suilend · USDC supply' },
        { name: 'cetus.zone', url: 'https://cetus.zone', preview: 'USDC/USDT LP' },
        { name: 'suiscan.xyz', url: 'https://suiscan.xyz/mainnet', preview: 'Sui mainnet · SUI' },
        { name: 'RWA flags', url: 'https://defillama.com', preview: 'USDY · OUSG · BUIDL restricted' },
      ],
    },
    painting: '1',
    durationMs: 12000,
  },

  // ─── Cycle 2 , TG · greeting + swap ──────────────────────────────────
  {
    id: 'swap',
    surface: 'tg',
    greeting: {
      prompt: 'gm',
      reply: 'gm ☀️',
    },
    prompt: 'swap 5 SUI for USDC on Cetus',
    toolStream: [
      { tool: 'sui.balance', args: 'SUI', status: 'ok' },
      { tool: 'swap.quote', args: '5 SUI → USDC', status: 'ok' },
      { tool: 'cetus.swap', args: 'route: SUI/USDC', status: 'ok' },
      { tool: 'sui.tx', args: 'Hwh6…uYvD', status: 'ok' },
      { tool: 'walrus.store', args: 'swap record', status: 'ok' },
    ],
    reply: `Cleared the gates, then settled.

policy: in-cap · dry-run: would succeed · approval: auto (in tier)

**5.000 SUI → 19.7 USDC** received.
Route: SUI → USDC via Cetus (0.05% tier)
Slippage 0.42% · within the 1% cap

Pre-swap: 12.563 USDC
Post-swap: **32.263 USDC**

Tx: suiscan.xyz/mainnet/tx/Hwh6…uYvD`,
    artifact: {
      type: 'swap',
      fromAmount: '5.000',
      fromSymbol: 'SUI',
      toAmount: '19.7',
      toSymbol: 'USDC',
      txHash: 'Hwh6kqVbnWnPmKx3p2dQ9aXc7fE4tB1rJgL8sN5uYvD',
      newBalance: '32.263 USDC',
    },
    painting: '2',
    // last provenance station fires at 7500ms (s-anchor) + ~3000ms outcome hold
    durationMs: 10500,
  },

  // ─── Cycle 3 , TUI · approval floor ───────────────────────────────────
  {
    id: 'commerce',
    surface: 'tui',
    prompt:
      'supply 25,000 USDC to Suilend',
    toolStream: [
      { tool: 'suilend.position', args: 'current', status: 'ok' },
      { tool: 'defi.yields', args: 'suilend usdc', status: 'ok' },
      { tool: 'suilend.supply', args: '25,000 USDC', status: 'ok' },
      { tool: 'sui.tx', args: '3kP9…7rS9', status: 'ok' },
      { tool: 'walrus.store', args: 'supply record', status: 'ok' },
    ],
    reply: `This one needs you.

**policy** , in-cap, recipient and coin allowlisted: pass.
**dry-run** , suilend.supply would succeed, est. gas 0.0021 SUI.
**approval** , 25,000 USDC crosses the material-risk threshold. The approval floor sits beneath the session mode, so I am holding it for you even though autonomy is set to auto.

Approve to supply, or deny to abort. Nothing has been executed yet.

[ approved ]

Supplied **25,000 USDC** to Suilend · supply APY ~4.6%.
Health factor: n/a (supply only) · earning from this checkpoint.
Tx: suiscan.xyz/mainnet/tx/3kP9…7rS9`,
    artifact: {
      type: 'audit',
      jobId: '3kP9mNqR7sT2vW5xY8zA1bC4dE6fG0hJkL3mN5pQ7rS9',
      agent: 'suilend.supply',
      bidAmount: '25,000 USDC',
      status: 'approved',
      reportHash: '0xb7ce1142e43d17a92c94a8f0',
      txHash: '3kP9mNqR7sT2vW5xY8zA1bC4dE6fG0hJkL3mN5pQ7rS9',
    },
    painting: '3',
    // last provenance station fires at 6700ms (c-storage) + ~3000ms outcome hold
    durationMs: 10500,
  },

  // ─── Cycle 4 , TG · greeting + Suilend position ──────────────────────
  {
    id: 'stake',
    surface: 'tg',
    greeting: {
      prompt: 'hi there',
      reply: 'hi 👋 ready when you are',
    },
    prompt: 'how is my Suilend position, and withdraw 2,000 USDC',
    toolStream: [
      { tool: 'suilend.position', args: 'current', status: 'ok' },
      { tool: 'suilend.withdraw', args: '2,000 USDC', status: 'ok' },
      { tool: 'sui.tx', args: '8jH2…6kL8', status: 'ok' },
      { tool: 'walrus.store', args: 'position record', status: 'ok' },
    ],
    reply: `Checked, then withdrew (in-cap, dry-run clean, auto-approved).

Suilend position before:
- Supplied: 27,000 USDC · supply APY ~4.6%
- No borrows · health factor: n/a

**Withdrew 2,000 USDC** back to your wallet.

Position now:
- Supplied: **25,000 USDC**
- Still earning ~4.6% APY

Tx: suiscan.xyz/mainnet/tx/8jH2…6kL8`,
    artifact: {
      type: 'stake',
      position: '25,000 USDC',
      validator: 'Suilend',
      apr: '4.6%',
      unlockBlock: 4_381_201,
      txHash: '8jH2kL4mN6pQ8rS0tU2vW4xY6zA8bC0dE2fG4hJ6kL8m',
    },
    painting: '4',
    // last provenance station fires at 7000ms (st-anchor) + ~3000ms outcome hold
    durationMs: 10000,
  },
]
