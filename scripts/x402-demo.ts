/**
 * Moon AI — x402 pay-per-answer demo.
 *
 * An agent pays a MoonToken fee by SIGNING an EIP-712 authorization off-chain (no
 * transaction, no wallet popup); the facilitator (Account 4) settles it on-chain via
 * CEP-3009 `transfer_with_authorization`. This is the x402 machine-to-machine
 * settlement that gates answer attempts.
 *
 *   bun run scripts/x402-demo.ts
 *
 * Env: CASPER_SECRET_KEY_PATH (Account 4), MOONAI_TOKEN_PACKAGE_HASH, CSPR_CLOUD_API_KEY.
 */
import { randomBytes } from 'node:crypto'
import {
  accountHashBytes,
  accountHashOf,
  loadSigner,
  moonToken,
  moonTokenPackageHash,
  newAgent,
  signDigest,
  txLink,
} from '@moonai/plugin-onchain'
import { transferWithAuthorizationDigest } from '@moonai/x402'

const PEM = process.env.CASPER_SECRET_KEY_PATH
if (!PEM) throw new Error('set CASPER_SECRET_KEY_PATH (Account 4 / facilitator)')

const facilitator = loadSigner(PEM) // Account 4 — holds MoonToken + pays gas
const facilitatorHash = accountHashOf(facilitator.publicKey)

const agent = newAgent() // a competitor; never submits a transaction
const agentHash = accountHashOf(agent.publicKey)

const FEE = 5_000_000_000n // 5 MOON answer fee
const VALID_BEFORE = 10_000_000_000n

console.log('🌙 Moon AI — x402 pay-per-answer\n')

// ① give the agent some MoonToken to pay with
console.log('① facilitator funds the agent with MoonToken…')
console.log('   ', txLink(await moonToken.transfer(facilitator, agentHash, FEE * 2n)))

// ② the agent signs an x402 authorization OFF-CHAIN (no transaction)
const nonce = new Uint8Array(randomBytes(32))
const digest = transferWithAuthorizationDigest(
  {
    name: 'Moon AI Token',
    version: '1',
    chainName: 'casper:casper-test',
    packageHash: moonTokenPackageHash(),
  },
  {
    from: accountHashBytes(agent.publicKey),
    to: accountHashBytes(facilitator.publicKey),
    value: FEE,
    validAfter: 0n,
    validBefore: VALID_BEFORE,
    nonce,
  },
)
const signature = signDigest(agent, digest)
console.log(
  `② agent signed the authorization off-chain (sig ${signature.length} bytes, no tx)`,
)

// ③ the facilitator settles it ON-CHAIN — the agent's funds move, agent never broadcast
console.log('③ facilitator settles via CEP-3009 transfer_with_authorization…')
const settleTx = await moonToken.transferWithAuthorization(facilitator, {
  fromAccountHash: agentHash,
  toAccountHash: facilitatorHash,
  amount: FEE,
  validAfter: 0n,
  validBefore: VALID_BEFORE,
  nonce,
  payerPublicKey: agent.publicKey,
  signature,
})
console.log('   ', txLink(settleTx))
console.log(
  '\n✅ x402 settled on-chain — the agent paid by signing; the facilitator submitted and paid gas. Machine-to-machine, no wallet popup.',
)
