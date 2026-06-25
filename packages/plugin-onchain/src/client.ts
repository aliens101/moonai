/**
 * Arena client — calls the deployed `Arena` contract entry points via casper-js-sdk
 * (Casper 2.0 Transaction API), funds fresh agent keypairs, and waits for results.
 *
 * Env: MOONAI_ARENA_PACKAGE_HASH, CASPER_NODE_RPC, CASPER_CHAIN_NAME, CSPR_CLOUD_API_KEY.
 */
import { readFileSync } from 'node:fs'
import {
  Args,
  CLValue,
  ContractCallBuilder,
  HttpHandler,
  Key,
  KeyAlgorithm,
  NativeTransferBuilder,
  PrivateKey,
  type PublicKey,
  RpcClient,
} from 'casper-js-sdk'

const NODE = process.env.CASPER_NODE_RPC ?? 'https://node.testnet.cspr.cloud/rpc'
const CHAIN = process.env.CASPER_CHAIN_NAME ?? 'casper-test'
const ARENA = (process.env.MOONAI_ARENA_PACKAGE_HASH ?? '').replace(/^hash-/, '')
const MOTES = 1_000_000_000

const handler = new HttpHandler(NODE)
if (process.env.CSPR_CLOUD_API_KEY)
  handler.setCustomHeaders({ Authorization: process.env.CSPR_CLOUD_API_KEY })
export const rpc = new RpcClient(handler)

export function loadSigner(pemPath: string): PrivateKey {
  return PrivateKey.fromPem(readFileSync(pemPath, 'utf8'), KeyAlgorithm.SECP256K1)
}

/** A fresh ed25519 agent keypair (a competitor "brings their own" in the real app). */
export function newAgent(): PrivateKey {
  return PrivateKey.generate(KeyAlgorithm.ED25519)
}

export function accountHashOf(pub: PublicKey): string {
  return pub.accountHash().toPrefixedString()
}

export function txLink(hash: string): string {
  return `https://testnet.cspr.live/transaction/${hash}`
}

async function waitResult(hash: string): Promise<{ ok: boolean; error?: string }> {
  const client = rpc as unknown as {
    getTransactionByTransactionHash?: (h: string) => Promise<unknown>
  }
  for (let i = 0; i < 48; i++) {
    await new Promise((r) => setTimeout(r, 5000))
    try {
      const r = (await client.getTransactionByTransactionHash?.(hash)) as {
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

async function submit(
  signer: PrivateKey,
  // biome-ignore lint/suspicious/noExplicitAny: casper-js-sdk tx type
  tx: any,
  label: string,
): Promise<string> {
  tx.sign(signer)
  const submitted = (await rpc.putTransaction(tx)) as {
    transactionHash?: { toHex?(): string }
  }
  const hash =
    submitted.transactionHash?.toHex?.() ?? String(submitted.transactionHash ?? submitted)
  const res = await waitResult(hash)
  if (!res.ok) throw new Error(`${label} reverted (${hash}): ${res.error}`)
  return hash
}

function call(
  signer: PrivateKey,
  entryPoint: string,
  args: Record<string, CLValue>,
  payCspr: number,
): Promise<string> {
  if (!ARENA) throw new Error('set MOONAI_ARENA_PACKAGE_HASH')
  const tx = new ContractCallBuilder()
    .from(signer.publicKey)
    .chainName(CHAIN)
    .byPackageHash(ARENA)
    .entryPoint(entryPoint)
    .runtimeArgs(Args.fromMap(args))
    .payment(payCspr * MOTES)
    .build()
  return submit(signer, tx, entryPoint)
}

/** Native CSPR transfer (used to fund fresh agent keypairs with gas). */
export function fund(from: PrivateKey, to: PublicKey, cspr: number): Promise<string> {
  const tx = new NativeTransferBuilder()
    .from(from.publicKey)
    .target(to)
    .amount((BigInt(cspr) * BigInt(MOTES)).toString())
    .id(Math.floor(Math.random() * 1e9))
    .chainName(CHAIN)
    .payment(100_000_000)
    .build()
  return submit(from, tx, 'transfer')
}

export const arena = {
  createMatch: (s: PrivateKey, entryFee: number, minPlayers: number) =>
    call(
      s,
      'create_match',
      {
        entry_fee: CLValue.newCLUInt512(entryFee),
        min_players: CLValue.newCLUInt32(minPlayers),
      },
      12,
    ),
  register: (s: PrivateKey, matchId: number) =>
    call(s, 'register', { match_id: CLValue.newCLUint64(matchId) }, 8),
  postQuestion: (s: PrivateKey, matchId: number, questionHash: string) =>
    call(
      s,
      'post_question',
      {
        match_id: CLValue.newCLUint64(matchId),
        question_hash: CLValue.newCLString(questionHash),
      },
      6,
    ),
  submitAnswer: (s: PrivateKey, matchId: number, answerHash: string) =>
    call(
      s,
      'submit_answer',
      {
        match_id: CLValue.newCLUint64(matchId),
        answer_hash: CLValue.newCLString(answerHash),
      },
      6,
    ),
  settle: (s: PrivateKey, matchId: number, winnerAccountHash: string, score: number) =>
    call(
      s,
      'settle',
      {
        match_id: CLValue.newCLUint64(matchId),
        winner: CLValue.newCLKey(Key.newKey(winnerAccountHash)),
        winner_score: CLValue.newCLUint8(score),
      },
      10,
    ),
  claim: (s: PrivateKey, matchId: number) =>
    call(s, 'claim', { match_id: CLValue.newCLUint64(matchId) }, 6),
}
