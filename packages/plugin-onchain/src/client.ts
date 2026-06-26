/**
 * Arena client — calls the deployed `Arena` contract entry points via casper-js-sdk
 * (Casper 2.0 Transaction API), funds fresh agent keypairs, and waits for results.
 *
 * Env: MOONAI_ARENA_PACKAGE_HASH, CASPER_NODE_RPC, CASPER_CHAIN_NAME, CSPR_CLOUD_API_KEY.
 */
import { randomBytes } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { transferWithAuthorizationDigest } from '@moonai/x402'
import {
  Args,
  CLTypeUInt8,
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
const TOKEN = (process.env.MOONAI_TOKEN_PACKAGE_HASH ?? '').replace(/^hash-/, '')
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

/** Read an account's named keys via raw JSON-RPC (state_get_account_info). */
export async function accountNamedKeys(
  publicKeyHex: string,
): Promise<{ name: string; key: string }[]> {
  const res = await fetch(NODE, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(process.env.CSPR_CLOUD_API_KEY
        ? { authorization: process.env.CSPR_CLOUD_API_KEY }
        : {}),
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'state_get_account_info',
      params: { public_key: publicKeyHex },
    }),
  })
  const data = (await res.json()) as {
    result?: { account?: { named_keys?: { name: string; key: string }[] } }
  }
  return data.result?.account?.named_keys ?? []
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

function callContract(
  signer: PrivateKey,
  pkg: string,
  entryPoint: string,
  args: Record<string, CLValue>,
  payCspr: number,
): Promise<string> {
  if (!pkg) throw new Error(`missing contract package hash for ${entryPoint}`)
  const tx = new ContractCallBuilder()
    .from(signer.publicKey)
    .chainName(CHAIN)
    .byPackageHash(pkg)
    .entryPoint(entryPoint)
    .runtimeArgs(Args.fromMap(args))
    .payment(payCspr * MOTES)
    .build()
  return submit(signer, tx, entryPoint)
}

const call = (
  signer: PrivateKey,
  entryPoint: string,
  args: Record<string, CLValue>,
  payCspr: number,
) => callContract(signer, ARENA, entryPoint, args, payCspr)

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

// --- x402 / MoonToken (CEP-3009) -------------------------------------------

function hexToBytes(hex: string): Uint8Array {
  const h = hex.replace(/^0x/, '')
  const out = new Uint8Array(h.length / 2)
  for (let i = 0; i < out.length; i++) {
    out[i] = Number.parseInt(h.slice(i * 2, i * 2 + 2), 16)
  }
  return out
}

/** Sign a 32-byte digest with a Casper key. Returns `[algo_tag | 64-byte sig]`
 * (65 bytes), the format the contract's `verify_signature` expects — casper-js-sdk
 * `sign()` returns the bare 64-byte signature, so we prepend the key's algorithm
 * prefix (0x01 ed25519, 0x02 secp256k1). */
export function signDigest(signer: PrivateKey, digest: Uint8Array): Uint8Array {
  const sig = signer.sign(digest)
  if (sig.length === 65) return sig
  const tag = Number.parseInt(signer.publicKey.toHex().slice(0, 2), 16)
  const out = new Uint8Array(sig.length + 1)
  out[0] = tag
  out.set(sig, 1)
  return out
}

/** The 32-byte account hash of a public key (no `account-hash-` prefix). */
export function accountHashBytes(pub: PublicKey): Uint8Array {
  return hexToBytes(accountHashOf(pub).replace(/^account-hash-/, ''))
}

/** The MoonToken 32-byte package hash (for the EIP-712 domain). */
export function moonTokenPackageHash(): Uint8Array {
  return hexToBytes(TOKEN)
}

const byteList = (b: Uint8Array) =>
  CLValue.newCLList(
    CLTypeUInt8,
    Array.from(b, (x) => CLValue.newCLUint8(x)),
  )

export const moonToken = {
  /** Move MoonToken from the caller to a recipient (`account-hash-…`). */
  transfer: (s: PrivateKey, recipientAccountHash: string, amount: bigint) =>
    callContract(
      s,
      TOKEN,
      'transfer',
      {
        recipient: CLValue.newCLKey(Key.newKey(recipientAccountHash)),
        amount: CLValue.newCLUInt256(amount.toString()),
      },
      8,
    ),

  /** CEP-3009 settle: the facilitator submits a payer's off-chain authorization. */
  transferWithAuthorization: (
    facilitator: PrivateKey,
    a: {
      fromAccountHash: string
      toAccountHash: string
      amount: bigint
      validAfter: bigint
      validBefore: bigint
      nonce: Uint8Array
      payerPublicKey: PublicKey
      signature: Uint8Array
    },
  ) =>
    callContract(
      facilitator,
      TOKEN,
      'transfer_with_authorization',
      {
        from: CLValue.newCLKey(Key.newKey(a.fromAccountHash)),
        to: CLValue.newCLKey(Key.newKey(a.toAccountHash)),
        amount: CLValue.newCLUInt256(a.amount.toString()),
        valid_after: CLValue.newCLUint64(a.validAfter.toString()),
        valid_before: CLValue.newCLUint64(a.validBefore.toString()),
        nonce: byteList(a.nonce),
        public_key: CLValue.newCLPublicKey(a.payerPublicKey),
        signature: byteList(a.signature),
      },
      10,
    ),
}

const X402_VALID_BEFORE = 10_000_000_000n

/**
 * Pay a MoonToken fee via x402: the payer signs an EIP-712 authorization off-chain
 * (no transaction), and the facilitator settles it on-chain via CEP-3009. Returns the
 * settle tx hash. This is how answer attempts are paid in the arena.
 */
export function x402Pay(
  facilitator: PrivateKey,
  payer: PrivateKey,
  amount: bigint,
): Promise<string> {
  const nonce = new Uint8Array(randomBytes(32))
  const digest = transferWithAuthorizationDigest(
    {
      name: 'Moon AI Token',
      version: '1',
      chainName: 'casper:casper-test',
      packageHash: moonTokenPackageHash(),
    },
    {
      from: accountHashBytes(payer.publicKey),
      to: accountHashBytes(facilitator.publicKey),
      value: amount,
      validAfter: 0n,
      validBefore: X402_VALID_BEFORE,
      nonce,
    },
  )
  return moonToken.transferWithAuthorization(facilitator, {
    fromAccountHash: accountHashOf(payer.publicKey),
    toAccountHash: accountHashOf(facilitator.publicKey),
    amount,
    validAfter: 0n,
    validBefore: X402_VALID_BEFORE,
    nonce,
    payerPublicKey: payer.publicKey,
    signature: signDigest(payer, digest),
  })
}
