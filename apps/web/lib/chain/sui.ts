// Sui chain reader for the MoonAi console.
//
// Replaces the old Sui (Sui/Sui dapp-kit) chain layer. Everything the console needs to
// render an agent — its SUI balance, its on-chain `AgentPolicy`, and its
// `ActionReceipt`s — is read here from a `@mysten/sui` SuiClient.
//
// The Move package `moonai::policy` is live on Sui MAINNET:
//   packageId 0x250880a4c1a268da8011b164f599d4e100cefce84f862d36396cd1a943ee8a35
// It owns a shared `AgentPolicy` object and emits/holds `ActionReceipt` objects.
//
// There is NO NFT/token: an agent's identity is its Sui address + its
// AgentPolicy object.

import { SuiClient, getFullnodeUrl } from '@mysten/sui/client'

/** Live MoonAi Move package on Sui mainnet. */
export const MOONAI_POLICY_PACKAGE_ID =
  '0x250880a4c1a268da8011b164f599d4e100cefce84f862d36396cd1a943ee8a35'

/** Native SUI coin type. 1 SUI = 1e9 MIST. */
export const SUI_COIN_TYPE = '0x2::sui::SUI'

export type SuiNetwork = 'mainnet' | 'testnet' | 'devnet' | 'localnet'

export const DEFAULT_NETWORK: SuiNetwork =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as SuiNetwork) || 'mainnet'

const clients = new Map<SuiNetwork, SuiClient>()

/** Memoized SuiClient per network (full-node JSON-RPC). */
export function getSuiClient(network: SuiNetwork = DEFAULT_NETWORK): SuiClient {
  let c = clients.get(network)
  if (!c) {
    c = new SuiClient({ url: getFullnodeUrl(network) })
    clients.set(network, c)
  }
  return c
}

// ─── AgentPolicy ────────────────────────────────────────────────────────────

/**
 * Deserialized `moonai::policy::AgentPolicy`. All amounts are in MIST (use
 * `formatSui` to display). `allowedCoins` are fully-qualified coin types and
 * `allowedProtocols` are package/object ids the agent may touch.
 */
export interface AgentPolicy {
  objectId: string
  owner: string
  agent: string
  budgetMist: bigint
  spentMist: bigint
  maxPerTxMist: bigint
  allowedCoins: string[]
  allowedProtocols: string[]
  expiryMs: bigint
  revoked: boolean
}

function asBigInt(v: unknown): bigint {
  if (typeof v === 'bigint') return v
  if (typeof v === 'number') return BigInt(Math.trunc(v))
  if (typeof v === 'string' && v.trim() !== '') {
    try {
      return BigInt(v)
    } catch {
      return 0n
    }
  }
  return 0n
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map(x => (typeof x === 'string' ? x : String(x)))
}

/**
 * Read an `AgentPolicy` shared object by its object id. Returns null if the id
 * does not resolve to a Move object with policy fields.
 */
export async function getAgentPolicy(
  objectId: string,
  network: SuiNetwork = DEFAULT_NETWORK,
): Promise<AgentPolicy | null> {
  const client = getSuiClient(network)
  const res = await client.getObject({ id: objectId, options: { showContent: true } })
  const content = res.data?.content
  if (!content || content.dataType !== 'moveObject') return null
  const f = content.fields as Record<string, unknown>
  if (f.budget_mist === undefined && f.agent === undefined && f.owner === undefined) return null
  return {
    objectId,
    owner: String(f.owner ?? ''),
    agent: String(f.agent ?? ''),
    budgetMist: asBigInt(f.budget_mist),
    spentMist: asBigInt(f.spent_mist),
    maxPerTxMist: asBigInt(f.max_per_tx_mist),
    allowedCoins: asStringArray(f.allowed_coins),
    allowedProtocols: asStringArray(f.allowed_protocols),
    expiryMs: asBigInt(f.expiry_ms),
    revoked: Boolean(f.revoked),
  }
}

// ─── Balances ────────────────────────────────────────────────────────────────

/** SUI balance (in MIST) of an address. 1 SUI = 1e9 MIST. */
export async function getSuiBalance(
  owner: string,
  network: SuiNetwork = DEFAULT_NETWORK,
): Promise<bigint> {
  const client = getSuiClient(network)
  const bal = await client.getBalance({ owner, coinType: SUI_COIN_TYPE })
  return asBigInt(bal.totalBalance)
}

// ─── ActionReceipts ──────────────────────────────────────────────────────────

/** Deserialized `moonai::policy::ActionReceipt`. Free-form: we surface what the
 *  Move struct exposes plus a couple of common fields the UI renders. */
export interface ActionReceipt {
  objectId: string
  /** Fully-qualified Move type, e.g. `<pkg>::policy::ActionReceipt`. */
  type: string
  /** The agent address this receipt was issued for, when present. */
  agent?: string
  /** Action / protocol label, when present. */
  action?: string
  /** Amount in MIST, when the receipt records a value-moving action. */
  amountMist?: bigint
  /** Unix ms timestamp, when present. */
  timestampMs?: bigint
  /** The raw decoded Move fields, for anything the typed view doesn't cover. */
  fields: Record<string, unknown>
}

const RECEIPT_STRUCT_SUFFIX = '::policy::ActionReceipt'

function isReceiptType(t: string | undefined): boolean {
  return typeof t === 'string' && t.includes(RECEIPT_STRUCT_SUFFIX)
}

function toReceipt(objectId: string, type: string, fields: Record<string, unknown>): ActionReceipt {
  return {
    objectId,
    type,
    agent: fields.agent !== undefined ? String(fields.agent) : undefined,
    action:
      fields.action !== undefined
        ? String(fields.action)
        : fields.protocol !== undefined
          ? String(fields.protocol)
          : undefined,
    amountMist:
      fields.amount_mist !== undefined
        ? asBigInt(fields.amount_mist)
        : fields.amount !== undefined
          ? asBigInt(fields.amount)
          : undefined,
    timestampMs:
      fields.timestamp_ms !== undefined
        ? asBigInt(fields.timestamp_ms)
        : fields.ts_ms !== undefined
          ? asBigInt(fields.ts_ms)
          : undefined,
    fields,
  }
}

/**
 * List `ActionReceipt` objects currently OWNED by an agent address. Receipts the
 * policy module transfers to the agent show up here. `limit` caps the page.
 */
export async function getActionReceiptsForOwner(
  owner: string,
  network: SuiNetwork = DEFAULT_NETWORK,
  limit = 25,
): Promise<ActionReceipt[]> {
  const client = getSuiClient(network)
  const out: ActionReceipt[] = []
  let cursor: string | null | undefined
  // Filter to receipts from the MoonAi package so unrelated owned objects are skipped.
  const filter = { StructType: `${MOONAI_POLICY_PACKAGE_ID}${RECEIPT_STRUCT_SUFFIX}` }
  do {
    const page = await client.getOwnedObjects({
      owner,
      cursor,
      filter,
      options: { showContent: true, showType: true },
    })
    for (const item of page.data) {
      const content = item.data?.content
      const objectId = item.data?.objectId
      if (!objectId || !content || content.dataType !== 'moveObject') continue
      out.push(toReceipt(objectId, content.type, content.fields as Record<string, unknown>))
      if (out.length >= limit) return out
    }
    cursor = page.hasNextPage ? page.nextCursor : undefined
  } while (cursor && out.length < limit)
  return out
}

/**
 * List recent `ActionReceipt`s for an agent by scanning events emitted by the
 * MoonAi package. Falls back to an empty list if the package emits no such event.
 * Useful when receipts are shared/frozen rather than owned by the agent.
 */
export async function getActionReceiptEvents(
  network: SuiNetwork = DEFAULT_NETWORK,
  limit = 25,
): Promise<ActionReceipt[]> {
  const client = getSuiClient(network)
  try {
    const page = await client.queryEvents({
      query: { MoveModule: { package: MOONAI_POLICY_PACKAGE_ID, module: 'policy' } },
      order: 'descending',
      limit,
    })
    const out: ActionReceipt[] = []
    for (const ev of page.data) {
      if (!isReceiptType(ev.type) && !ev.type.includes('Receipt')) continue
      const fields = (ev.parsedJson ?? {}) as Record<string, unknown>
      out.push(toReceipt(ev.id.txDigest, ev.type, fields))
    }
    return out
  } catch {
    return []
  }
}

/**
 * Best-effort recent receipts for an agent: owned receipt objects first, then
 * package events as a fallback. Returns at most `limit`.
 */
export async function getRecentReceipts(
  agent: string,
  network: SuiNetwork = DEFAULT_NETWORK,
  limit = 25,
): Promise<ActionReceipt[]> {
  const owned = await getActionReceiptsForOwner(agent, network, limit).catch(() => [])
  if (owned.length > 0) return owned
  const events = await getActionReceiptEvents(network, limit)
  return events.filter(r => !r.agent || r.agent === agent)
}
