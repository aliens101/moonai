// The MoonAi "agent wallet" on Sui.
//
// On Sui there is NO derived EOA and NO NFT/token: an agent's identity is simply
// its Sui address plus the on-chain `AgentPolicy` object that bounds what it may
// do. The CLI/gateway holds the signing key; the web console is a read + author
// surface that resolves the agent address and policy object id from app config
// (env) and reads their state from chain.

import { DEFAULT_NETWORK, type SuiNetwork } from './chain/chain'

/** The agent's on-chain identity as the console understands it. */
export interface AgentIdentity {
  /** The agent's Sui address (0x…64 hex). */
  agentAddress: string | null
  /** Object id of the agent's shared `AgentPolicy`. */
  policyObjectId: string | null
  network: SuiNetwork
}

/** Read the configured agent identity from public env. Safe on client + server. */
export function getConfiguredAgentIdentity(): AgentIdentity {
  return {
    agentAddress: process.env.NEXT_PUBLIC_MOONAI_AGENT_ADDRESS ?? null,
    policyObjectId: process.env.NEXT_PUBLIC_MOONAI_POLICY_OBJECT_ID ?? null,
    network: DEFAULT_NETWORK,
  }
}

const SUI_ADDRESS_RE = /^0x[0-9a-fA-F]{1,64}$/

/** True if `s` is a syntactically valid Sui address or object id. */
export function isSuiAddress(s: string): boolean {
  return SUI_ADDRESS_RE.test(s)
}

/** Normalize a Sui address/object id to lowercase 0x-prefixed form. */
export function normalizeSuiAddress(s: string): string {
  const v = s.trim().toLowerCase()
  return v.startsWith('0x') ? v : `0x${v}`
}
