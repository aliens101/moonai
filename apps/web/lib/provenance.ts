/**
 * Provenance ledger entries , what the write pipeline did for each cycle
 * (policy, simulation, approval, execution). The right-side hero canvas
 * renders these as commentary on the left-side chat.
 *
 * The narration is the headline: a plain-English sentence a non-crypto
 * reader can grasp in 2 seconds. The proof is small mono evidence
 * underneath. These are illustrative demos, not live transactions.
 */

export type StampKind =
  | 'wallet'
  | 'attestation'
  | 'sandbox'
  | 'storage'
  | 'chain'
  | 'inbox'
  | 'market'

/**
 * Tool-specific animated glyph kind. Each one renders a small SVG icon
 * inside the station node , the icon ANIMATES on station activation
 * (the line draws itself, the lock shackle closes, etc.) so the moment
 * of the substrate firing is visible.
 */
export type GlyphKind =
  | 'sign'
  | 'brain'
  | 'browser'
  | 'lock'
  | 'anchor'
  | 'swap'
  | 'stake'
  | 'message'
  | 'gavel'

export type Receipt = {
  id: string
  /** Tool-specific animated glyph for the station node. */
  glyph: GlyphKind
  /** Legacy big-stamp kind , kept for cycles that haven't been migrated. */
  stamp?: StampKind
  /** Title-cased display label rendered in the right-side panel. */
  layer: 'You' | 'Brain' | 'Limbs' | 'Memory' | 'Chain' | 'Comms' | 'Commerce'
  /** Plain-English sentence that EXPLAINS what just happened. */
  narration: string
  /** Optional explorer link , when set, renders a "verify on chain ↗" link below the narration. */
  proofHref?: string
  delayMs: number
}

export type Provenance = {
  /** One-line frame for the whole right panel for this cycle. */
  intro: string
  outcome: string
  receipts: Receipt[]
}

// Generic Sui explorer. `proofHref` points at the mainnet explorer rather than
// a specific object, so the "verify on chain" link is honest about these being
// illustrative demos rather than a particular fabricated id.
const SUISCAN = 'https://suiscan.xyz/mainnet'

const INTRO = 'every write crosses the same four gates'

// ─── per-cycle provenance ──────────────────────────────────────────────
//
// All cycles follow a 5-station voyage synced to the left-side chat that
// mirrors the write pipeline:
//   1. You      , the operator's intent
//   2. Brain    , the model proposes a plan
//   3. [action] , the cycle's headline beat (policy / simulate / execute)
//   4. Memory   , the decision is recorded locally
//   5. Chain    , the cleared action executes on Sui (omitted for cycle 3,
//                 where the approval beat IS the finale)
//
// `delayMs` for each station is hand-tuned to fire just after the matching
// left-side moment lands. See TuiCanvas.tsx + TgCanvas.tsx for the left-side
// timing constants. `cycle.durationMs` in lib/cycles.ts is derived as
// `last_station_delayMs + ~3000ms outcome hold`.

export const PROVENANCE: Record<string, Provenance> = {
  // ─── Cycle 1 , TUI · research ────────────────────────────────────────
  // TuiCanvas: commit at 2800, tools start at 2800 stagger 700ms each, last
  // tool (memory.save, idx 5) at 6300, reply at 7600.
  research: {
    intro: INTRO,
    outcome: 'Yield scan saved · DeFiLlama discovery, read-only',
    receipts: [
      {
        id: 'r-sign',
        glyph: 'sign',
        stamp: 'wallet',
        layer: 'You',
        narration: 'You asked for the best stablecoin yield on Sui, with restricted products flagged.',
        delayMs: 2700, // just after `you · …` row commits
      },
      {
        id: 'r-attest',
        glyph: 'brain',
        stamp: 'attestation',
        layer: 'Brain',
        narration:
          'The model decided which tools to call. It advises only; it never gets the final word on funds.',
        delayMs: 3100, // as "thinking…" appears
      },
      {
        id: 'r-sandbox',
        glyph: 'browser',
        stamp: 'sandbox',
        layer: 'Limbs',
        narration:
          'Discovery ran read-only through DeFiLlama. No value moved, so no gate was needed.',
        delayMs: 3500, // first tool block visible
      },
      {
        id: 'r-storage',
        glyph: 'lock',
        stamp: 'storage',
        layer: 'Memory',
        narration: 'The scan was written to the local content-addressed store for recall later.',
        delayMs: 6700, // memory.save tool block lands
      },
      {
        id: 'r-chain',
        glyph: 'anchor',
        stamp: 'chain',
        layer: 'Chain',
        narration:
          'Restricted RWA products (USDY, OUSG, BUIDL) were flagged, not proposed, without eligibility.',
        proofHref: SUISCAN,
        delayMs: 9000, // ~1.4s after reply lands
      },
    ],
  },

  // ─── Cycle 2 , TG · swap ─────────────────────────────────────────────
  // TgCanvas: greeting 200/800/1500, main user at 2400, think at 3000,
  // tools at 3800 stagger 380ms each. chain.tx (idx 3) lands at 4940.
  // memory.save (idx 4) at 5320. Reply at 6320.
  swap: {
    intro: INTRO,
    outcome: '5 SUI → 19.7 USDC · cleared the gates, then settled',
    receipts: [
      {
        id: 's-sign',
        glyph: 'sign',
        stamp: 'wallet',
        layer: 'You',
        narration: 'You asked to swap 5 SUI for USDC on Cetus.',
        delayMs: 2500, // main user prompt commits
      },
      {
        id: 's-attest',
        glyph: 'brain',
        stamp: 'attestation',
        layer: 'Brain',
        narration: 'The model proposed a route (SUI → USDC via Cetus). The gates decide the rest.',
        delayMs: 3100, // think bubble visible
      },
      {
        id: 's-chain-swap',
        glyph: 'swap',
        stamp: 'chain',
        layer: 'Chain',
        narration:
          'Policy passed and dry-run said it would succeed, so the swap PTB executed on Sui.',
        proofHref: SUISCAN,
        delayMs: 5000, // chain.tx tool ✓ confirms
      },
      {
        id: 's-storage',
        glyph: 'lock',
        stamp: 'storage',
        layer: 'Memory',
        narration: 'The decision record was written to the local content-addressed store.',
        delayMs: 6000, // memory.save tool ✓ confirms
      },
      {
        id: 's-anchor',
        glyph: 'anchor',
        stamp: 'chain',
        layer: 'Chain',
        narration:
          'An ActionReceipt came back with the policy verdict, the simulated gas, and the tx digest.',
        proofHref: SUISCAN,
        delayMs: 7500, // ~1.2s after reply lands
      },
    ],
  },

  // ─── Cycle 3 , TUI · commerce ────────────────────────────────────────
  // TuiCanvas: commit at 2800, tools at 2800 stagger 700ms.
  // agent.message (idx 2) at 4200. market.acceptResult (idx 4) at 5600.
  // memory.save (idx 5) at 6300. Reply at 7600. No anchor station: the
  // approval beat IS the finale here (human approves, then it executes).
  commerce: {
    intro: INTRO,
    outcome: '25,000 USDC supplied to Suilend · held for approval, then executed',
    receipts: [
      {
        id: 'c-sign',
        glyph: 'sign',
        stamp: 'wallet',
        layer: 'You',
        narration: 'You asked to supply 25,000 USDC to Suilend.',
        delayMs: 2900, // just after commit
      },
      {
        id: 'c-attest',
        glyph: 'brain',
        stamp: 'attestation',
        layer: 'Brain',
        narration: 'The model proposed the supply. Policy passed and simulation said it would succeed.',
        delayMs: 3300, // just before tools
      },
      {
        id: 'c-inbox',
        glyph: 'message',
        stamp: 'inbox',
        layer: 'Comms',
        narration:
          'The size crossed the material-risk threshold, so the approval floor held it for a human.',
        proofHref: SUISCAN,
        delayMs: 4400, // agent.message tool ✓
      },
      {
        id: 'c-market',
        glyph: 'gavel',
        stamp: 'market',
        layer: 'Commerce',
        narration:
          'You approved, even though autonomy was set to auto. Only then did suilend.supply execute.',
        proofHref: SUISCAN,
        delayMs: 5800, // market.acceptResult tool ✓
      },
      {
        id: 'c-storage',
        glyph: 'lock',
        stamp: 'storage',
        layer: 'Memory',
        narration: 'The decision record was written to the local content-addressed store.',
        delayMs: 6700, // memory.save tool ✓
      },
    ],
  },

  // ─── Cycle 4 , TG · stake ────────────────────────────────────────────
  // TgCanvas: greeting 200/800/1500, main user at 2400, think at 3000,
  // tools at 3800 stagger 380ms. chain.tx (idx 2) at 4560. memory.save
  // (idx 3) at 4940. Reply at 5940.
  stake: {
    intro: INTRO,
    outcome: '2,000 USDC withdrawn from Suilend · position now 25,000 USDC',
    receipts: [
      {
        id: 'st-sign',
        glyph: 'sign',
        stamp: 'wallet',
        layer: 'You',
        narration: 'You asked for your Suilend position and to withdraw 2,000 USDC.',
        delayMs: 2500, // main user prompt commits
      },
      {
        id: 'st-attest',
        glyph: 'brain',
        stamp: 'attestation',
        layer: 'Brain',
        narration:
          'The model read the position with suilend.position, then proposed the withdrawal.',
        delayMs: 3100, // think bubble visible
      },
      {
        id: 'st-chain-stake',
        glyph: 'stake',
        stamp: 'chain',
        layer: 'Chain',
        narration:
          'In-cap and dry-run clean, so suilend.withdraw executed on Sui and returned 2,000 USDC.',
        proofHref: SUISCAN,
        delayMs: 4500, // chain.tx tool ✓
      },
      {
        id: 'st-storage',
        glyph: 'lock',
        stamp: 'storage',
        layer: 'Memory',
        narration: 'The updated position was written to the local content-addressed store.',
        delayMs: 5500, // memory.save tool ✓
      },
      {
        id: 'st-anchor',
        glyph: 'anchor',
        stamp: 'chain',
        layer: 'Chain',
        narration:
          'An ActionReceipt came back with the policy verdict, the simulated gas, and the tx digest.',
        proofHref: SUISCAN,
        delayMs: 7000, // ~1.1s after reply lands
      },
    ],
  },
}
