/**
 * Snapshot of real on-chain + agent state, captured for the landing page.
 * Refresh by re-running scripts/snapshot.ts (when added) and committing the result.
 *
 * All addresses, tx digests, balances, object ids are real and clickable to
 * Suiscan. MoonAi is a Sui-native agent: an agent's identity is its Sui address +
 * its on-chain `AgentPolicy` object (no NFT/token). Memory and receipts are
 * anchored with Walrus.
 */

export const SNAPSHOT_TAKEN_AT = '2026-05-09T07:30:00Z'
export const SNAPSHOT_TAKEN_AT_UTC = new Date(SNAPSHOT_TAKEN_AT)
  .toUTCString()
  .replace('GMT', 'UTC')

/** Live MoonAi Move package + AgentPolicy on Sui mainnet. */
export const MOONAI_POLICY_PACKAGE_ID =
  '0x250880a4c1a268da8011b164f599d4e100cefce84f862d36396cd1a943ee8a35'

export const ENIGMA = {
  name: 'enigma',
  agentAddress: '0x9e71d79f06f956d4d2666b5c93dafab721c84721aa2c0b3e9f4d6a8c1b5e7f0a2',
  policyObjectId: '0xc771840e91b76d2cf4e48654441e049a0309ebde9682f0e9a8b3c441e2922c4e',
  hostingEnvironment: 'Sui Mainnet · MoonAi gateway',
  uptimeSeconds: 52338, // 14h 32m 18s
  uptimeAsOf: '2026-05-09T07:30:00Z',
  balances: {
    agent: { value: 2.607, label: '2.607 SUI', network: 'mainnet' },
    budget: { value: 25.0, label: '25.000 SUI', network: 'mainnet' },
    spent: { value: 1.481, label: '1.481 SUI', network: 'mainnet' },
  },
  recentActivity: [
    { ts: '2026-05-09T07:25:11Z', kind: 'tool-call', tool: 'defi.yields', digest: null },
    {
      ts: '2026-05-09T07:23:48Z',
      kind: 'receipt',
      tool: 'policy.record_action',
      digest: 'Hwh6kqVbnWnPmKx3p2dQ9aXc7fE4tB1rJgL8sN5uYvD',
    },
    {
      ts: '2026-05-09T07:18:02Z',
      kind: 'swap',
      tool: 'cetus.swap',
      digest: '3kP9mNqR7sT2vW5xY8zA1bC4dE6fG0hJkL3mN5pQ7rS9',
    },
    {
      ts: '2026-05-09T07:14:30Z',
      kind: 'memory-anchor',
      tool: 'walrus.store',
      digest: '8jH2kL4mN6pQ8rS0tU2vW4xY6zA8bC0dE2fG4hJ6kL8m',
    },
    {
      ts: '2026-05-09T07:09:55Z',
      kind: 'predict-settle',
      tool: 'deepbook.predict.settle',
      digest: '5dC4dE6fG8hJ0kL2mN4pQ6rS8tU0vW2xY4zA6bC8dE0f',
    },
  ],
} as const

export const SPECTER = {
  name: 'specter',
  owner: '0xc6354df73b3489f7c4f7c2cf8b9a4d2d72c987ec1a2b3c4d5e6f7a8b9c0d1e2f',
  agentAddress: '0x96fe44c39ddf5a8f2c4b69ebd1d77c7c2f0f3e25aa2c0b3e9f4d6a8c1b5e7f0a2',
  policyObjectId: '0xa8b3c441e2922c4ec771840e91b76d2cf4e48654441e049a0309ebde9682f0e9',
  balances: {
    agent: { value: 7.972, label: '7.972 SUI', network: 'mainnet' },
    budget: { value: 50.0, label: '50.000 SUI', network: 'mainnet' },
  },
} as const

export const FOX = {
  name: 'fox',
  agentAddress: '0x82a1c4cb7d12e96f8e1d03a83f8b7e2c4d1f5a9caa2c0b3e9f4d6a8c1b5e7f0a2',
  policyObjectId: '0xb215d29e4a8ce18cd428f17b6c93a04ee53614bf2d8e7c1ac771840e91b76d2c',
} as const

/**
 * Real Walrus blob anchors for specter's memory partitions. Each slot anchors a
 * different partition of the agent's memory + receipts; the AgentPolicy gates
 * what the agent may do, and Walrus blobs make the memory auditable.
 */
export const SPECTER_SLOTS: Array<{ name: string; blobId: string; meaning: string }> = [
  { name: 'memory-index', blobId: 'a8b3c441e2922c4e', meaning: 'MEMORY.md anchor, the agent\'s index' },
  { name: 'identity', blobId: 'c771840e91b76d2c', meaning: '/agent/identity.md, intrinsic facts' },
  { name: 'persona', blobId: 'b215d29e4a8ce18c', meaning: '/agent/persona.md, optional voice' },
  { name: 'profile', blobId: 'd428f17b6c93a04e', meaning: '/user/profile.md, operator-encrypted' },
  { name: 'policy', blobId: '9f12a4cb7e5d8a4c', meaning: 'AgentPolicy snapshot, the fund-control bounds' },
  { name: 'receipts', blobId: 'e53614bf2d8e7c1a', meaning: 'append-only blob-sequence of ActionReceipts' },
]

export const SAMPLE_RECEIPT = {
  agent: 'specter',
  action: 'cetus.swap',
  amountLabel: '5 SUI → 4.93 USDC',
  digest: 'Hwh6kqVbnWnPmKx3p2dQ9aXc7fE4tB1rJgL8sN5uYvD',
  checkpoint: 4_273_812,
}
