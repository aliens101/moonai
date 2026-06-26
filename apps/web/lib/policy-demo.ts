/**
 * Browser-faithful port of the on-chain policy engine
 * (`moonai::policy` Move module + `packages/plugin-onchain` policy checks). Pure +
 * deterministic, SUI amounts as numbers for the playground. The verdict logic
 * mirrors the real engine: the AI is advisory; this code decides what is
 * allowed. Caps map to the live `AgentPolicy` object:
 *   maxNativeSui   ↔ max_per_tx_mist (per-tx hard cap, in MIST)
 *   tokenAllowlist ↔ allowed_coins   (fully-qualified coin types)
 *   recipientAllowlist / protocols ↔ allowed_protocols
 */

export type Autonomy = 'auto' | 'confirm' | 'readonly'

export interface DemoPolicy {
  readOnly?: boolean
  /** Per-tx hard cap on native SUI (maps to max_per_tx_mist). */
  maxNativeSui?: number | null
  /** Auto-execute ceiling — above this, hold for human approval. */
  autoMaxNativeSui?: number | null
  maxSlippageBps?: number | null
  recipientAllowlist?: string[]
  tokenAllowlist?: string[]
  autonomy?: Autonomy
}

export interface DemoAction {
  kind: 'transfer' | 'swap'
  /** 'native' or a coin symbol/type. For a swap: the INPUT asset. */
  asset: string
  amountSui: number
  to?: string
  /** Swap OUTPUT asset (checked against the coin allowlist). */
  toAsset?: string
  slippageBps?: number
}

export interface DemoVerdict {
  violations: string[]
  allowed: boolean
  requiresApproval: boolean
}

const lc = (s: string) => s.trim().toLowerCase()
const isNative = (s: string) => {
  const v = lc(s)
  return v === 'native' || v === 'sui' || v === '0x2::sui::sui'
}

export function evaluateDemoPolicy(action: DemoAction, policy: DemoPolicy): DemoVerdict {
  const violations: string[] = []
  const readOnly = policy.readOnly || policy.autonomy === 'readonly'
  if (readOnly) violations.push('policy is read-only: all writes are blocked')

  const inputNative = isNative(action.asset)

  // Coin allowlist — input AND, for swaps, output (else you could swap an
  // allowed coin into an arbitrary one).
  if (policy.tokenAllowlist && policy.tokenAllowlist.length > 0) {
    const allowed = policy.tokenAllowlist.map(lc)
    if (!inputNative && !allowed.includes(lc(action.asset))) {
      violations.push(`coin ${action.asset} is not in the coin allowlist`)
    }
    if (action.kind === 'swap' && action.toAsset && !isNative(action.toAsset)) {
      if (!allowed.includes(lc(action.toAsset))) {
        violations.push(`swap output coin ${action.toAsset} is not in the coin allowlist`)
      }
    }
  }

  // Recipient allowlist (transfers).
  if (policy.recipientAllowlist && policy.recipientAllowlist.length > 0 && action.to) {
    const allowed = policy.recipientAllowlist.map(lc)
    if (!allowed.includes(lc(action.to))) {
      violations.push(`recipient ${action.to} is not in the recipient allowlist`)
    }
  }

  // Native per-tx cap (max_per_tx_mist).
  if (inputNative && policy.maxNativeSui != null && action.amountSui > policy.maxNativeSui) {
    violations.push(`native amount ${action.amountSui} SUI exceeds per-tx cap ${policy.maxNativeSui} SUI`)
  }

  // Slippage cap (swaps).
  if (
    action.slippageBps != null &&
    policy.maxSlippageBps != null &&
    action.slippageBps > policy.maxSlippageBps
  ) {
    violations.push(`slippage ${action.slippageBps} bps exceeds max ${policy.maxSlippageBps} bps`)
  }

  const allowed = violations.length === 0

  let requiresApproval = false
  if (allowed) {
    if (policy.autonomy === 'confirm') {
      requiresApproval = true
    } else if (
      inputNative &&
      policy.autoMaxNativeSui != null &&
      action.amountSui > policy.autoMaxNativeSui
    ) {
      requiresApproval = true
    }
  }

  return { violations, allowed, requiresApproval }
}
