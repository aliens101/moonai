/**
 * Deploy the Moon AI Odra contracts to Casper Testnet via casper-js-sdk against the
 * CSPR.cloud node (auth header), submitting with the 2.0 Transaction API
 * (`putTransaction`) and polling the RPC for the execution result. Replicates Odra's
 * install args (4 odra_cfg_* named args) plus any contract init() args.
 *
 *   bun run scripts/deploy.ts [ContractName ...]
 */
import { readFileSync } from 'node:fs'
import {
  Args,
  CLValue,
  HttpHandler,
  Key,
  KeyAlgorithm,
  PrivateKey,
  RpcClient,
  SessionBuilder,
} from 'casper-js-sdk'

const NODE = process.env.CASPER_NODE_RPC ?? 'https://node.testnet.cspr.cloud/rpc'
const CHAIN = process.env.CASPER_CHAIN_NAME ?? 'casper-test'
const KEY = process.env.CSPR_CLOUD_API_KEY
const PEM = process.env.CASPER_SECRET_KEY_PATH
if (!PEM) throw new Error('set CASPER_SECRET_KEY_PATH')

// Account 4 is the deployer + the Arena orchestrator authority (MVP).
const ACCOUNT4 =
  'account-hash-fabe6ffa677c2360e265d1235106abb07f895661dfb4fee388b275dbf06d044c'

const handler = new HttpHandler(NODE)
if (KEY) handler.setCustomHeaders({ Authorization: KEY })
const rpc = new RpcClient(handler)
const sk = PrivateKey.fromPem(readFileSync(PEM, 'utf8'), KeyAlgorithm.SECP256K1)

type InitArgs = Record<string, CLValue>
const ALL: Array<{ name: string; key: string; pay: number; init?: InitArgs }> = [
  { name: 'MoonToken', key: 'moonai_token', pay: 500 },
  {
    name: 'Arena',
    key: 'moonai_arena',
    pay: 550,
    init: { orchestrator: CLValue.newCLKey(Key.newKey(ACCOUNT4)) },
  },
]
const want = process.argv.slice(2)
const contracts = want.length ? ALL.filter(c => want.includes(c.name)) : ALL

const MOTES = 1_000_000_000

async function waitResult(hash: string): Promise<{ ok: boolean; error?: string }> {
  const any = rpc as unknown as {
    getTransactionByTransactionHash?: (h: string) => Promise<unknown>
  }
  for (let i = 0; i < 40; i++) {
    await new Promise(r => setTimeout(r, 5000))
    try {
      const r = (await any.getTransactionByTransactionHash?.(hash)) as {
        executionInfo?: { executionResult?: { errorMessage?: string } }
      }
      const exec = r?.executionInfo?.executionResult
      if (exec) return { ok: !exec.errorMessage, error: exec.errorMessage }
    } catch {
      /* keep polling */
    }
  }
  return { ok: false, error: 'no execution result within timeout' }
}

for (const c of contracts) {
  // Lower to the MVP Wasm feature set (Casper's VM rejects bulk-memory/sign-ext);
  // idempotent if the wasm is already MVP. Falls back to the raw wasm if wasm-opt
  // is unavailable.
  const src = `moonai-contracts/wasm/${c.name}.wasm`
  const lowered = `/tmp/moonai-${c.name}-mvp.wasm`
  const opt = Bun.spawnSync([
    'wasm-opt',
    src,
    '--enable-bulk-memory',
    '--enable-sign-ext',
    '--signext-lowering',
    '--llvm-memory-copy-fill-lowering',
    '--memory-packing',
    '-O2',
    '-o',
    lowered,
  ])
  const wasm = new Uint8Array(readFileSync(opt.exitCode === 0 ? lowered : src))
  const args = Args.fromMap({
    odra_cfg_package_hash_key_name: CLValue.newCLString(c.key),
    odra_cfg_allow_key_override: CLValue.newCLValueBool(true),
    odra_cfg_is_upgradable: CLValue.newCLValueBool(true),
    odra_cfg_is_upgrade: CLValue.newCLValueBool(false),
    ...(c.init ?? {}),
  })
  const tx = new SessionBuilder()
    .from(sk.publicKey)
    .chainName(CHAIN)
    .wasm(wasm)
    .installOrUpgrade()
    .runtimeArgs(args)
    .payment(c.pay * MOTES)
    .build()
  tx.sign(sk)

  const submitted = (await rpc.putTransaction(tx)) as {
    transactionHash?: { toHex?(): string }
  }
  const hash =
    submitted.transactionHash?.toHex?.() ?? String(submitted.transactionHash ?? submitted)
  console.log(`\n${c.name}: submitted ${hash}`)
  console.log(`  https://testnet.cspr.live/transaction/${hash}`)
  const res = await waitResult(hash)
  if (!res.ok) {
    console.log(`  ❌ FAILED: ${res.error}`)
    process.exit(1)
  }
  console.log(`  ✅ installed → named key '${c.key}' (read its package hash from the account)`)
}
console.log('\nDone. Record the package hashes in .env.')
