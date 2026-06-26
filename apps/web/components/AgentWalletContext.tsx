'use client'

// The Sui "agent wallet" context.
//
// On Sui there is no derived EOA / keystore: an agent is its Sui address + its
// on-chain `AgentPolicy` object. This context resolves that identity (from app
// config) and exposes the connected wallet as the read subject for "my balance /
// my portfolio" questions. The CLI/gateway does the signing; the console reads
// and authors.

import { type AgentIdentity, getConfiguredAgentIdentity } from '@/lib/agent-wallet'
import { type AgentPolicy, getAgentPolicy } from '@/lib/chain/sui'
import { useCurrentAccount } from '@mysten/dapp-kit'
import { type ReactNode, createContext, useContext, useEffect, useMemo, useState } from 'react'

interface AgentWalletValue {
  /** The configured agent identity (address + policy object id + network). */
  identity: AgentIdentity
  /** Convenience: the agent's Sui address, or null when unconfigured. */
  agentAddress: string | null
  /** Convenience: the agent's AgentPolicy object id, or null. */
  policyObjectId: string | null
  /** Subject for "my balance / portfolio" reads — the connected wallet. */
  activeAddress: string | null
  /** The agent's on-chain policy, once loaded. */
  policy: AgentPolicy | null
  policyLoading: boolean
  error: string | null
}

const Ctx = createContext<AgentWalletValue | null>(null)

export function AgentWalletProvider({ children }: { children: ReactNode }) {
  const account = useCurrentAccount()
  const identity = useMemo(() => getConfiguredAgentIdentity(), [])
  const [policy, setPolicy] = useState<AgentPolicy | null>(null)
  const [policyLoading, setPolicyLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!identity.policyObjectId) {
      setPolicy(null)
      return
    }
    let alive = true
    setPolicyLoading(true)
    setError(null)
    getAgentPolicy(identity.policyObjectId, identity.network)
      .then(p => {
        if (alive) setPolicy(p)
      })
      .catch(e => {
        if (alive) setError((e as Error).message?.slice(0, 160) ?? 'policy read failed')
      })
      .finally(() => {
        if (alive) setPolicyLoading(false)
      })
    return () => {
      alive = false
    }
  }, [identity.policyObjectId, identity.network])

  return (
    <Ctx.Provider
      value={{
        identity,
        agentAddress: identity.agentAddress,
        policyObjectId: identity.policyObjectId,
        activeAddress: account?.address ?? null,
        policy,
        policyLoading,
        error,
      }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useAgentWallet(): AgentWalletValue {
  const c = useContext(Ctx)
  if (!c) throw new Error('useAgentWallet must be used within AgentWalletProvider')
  return c
}
