/**
 * Read the deployed contract package hashes from Account 4's named keys.
 *   bun run scripts/hashes.ts
 */
import { HttpHandler, PublicKey, RpcClient } from 'casper-js-sdk'

const handler = new HttpHandler(
  process.env.CASPER_NODE_RPC ?? 'https://node.testnet.cspr.cloud/rpc',
)
if (process.env.CSPR_CLOUD_API_KEY)
  handler.setCustomHeaders({ Authorization: process.env.CSPR_CLOUD_API_KEY })
const rpc = new RpcClient(handler)

const PUB = '0203684aa256a6e48c4d3bb2909cff9f71d6f7c52c96b549d19b09fd298600cfba6b'

// biome-ignore lint/suspicious/noExplicitAny: probing SDK response shape
const info: any = await rpc.getAccountInfo(PublicKey.fromHex(PUB))
const acct = info.account ?? info
const nks = acct.namedKeys?.keys ?? acct.namedKeys ?? acct.named_keys ?? []
for (const nk of nks) {
  const name = nk.name
  const key = nk.key?.toString?.() ?? nk.key ?? nk.value
  if (String(name).startsWith('moonai')) console.log(`${name}=${key}`)
}
