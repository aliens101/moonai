// Sui personal-message sign-in: message construction + signature verification.
//
// (Path kept as lib/auth/messages.ts for import stability. The scheme is now a
// Sui personal-message signature, verified with @mysten/sui/verify — no Sui sign-in /
// EIP-4361 / Sui involved.)

import 'server-only'
import { verifyPersonalMessageSignature } from '@mysten/sui/verify'

const STATEMENT = 'Sign in to MoonAi'

/**
 * Build the exact human-readable message the wallet signs. The client encodes
 * this with TextEncoder before signing; the server rebuilds the identical
 * string from the verified address + stored nonce.
 */
export function buildSignInMessage(opts: { address: string; nonce: string }): string {
  return `${STATEMENT}\naddress: ${opts.address}\nnonce: ${opts.nonce}`
}

export type SuiVerifyResult = { ok: true; address: string } | { ok: false; reason: string }

/**
 * Verify a Sui personal-message signature.
 *
 * 1. Rebuild the expected message from the claimed address + the server's
 *    single-use nonce.
 * 2. Recover the public key from the signature over that message bytes.
 * 3. Confirm the recovered key's Sui address matches the claimed address.
 *
 * This binds the signature to both the address and the server nonce, so a
 * captured signature cannot be replayed (the nonce is rotated on success).
 */
export async function verifySuiSignIn(opts: {
  address: string
  message: string
  signature: string
  expectedNonce: string
}): Promise<SuiVerifyResult> {
  const { address, message, signature, expectedNonce } = opts

  const claimed = normalizeSuiAddress(address)
  if (!claimed) {
    return { ok: false, reason: 'invalid sui address' }
  }

  // The message must be exactly the one we'd build for this address + nonce.
  const expectedMessage = buildSignInMessage({ address, nonce: expectedNonce })
  if (message !== expectedMessage) {
    return { ok: false, reason: 'message mismatch' }
  }

  let signerAddress: string
  try {
    const publicKey = await verifyPersonalMessageSignature(
      new TextEncoder().encode(message),
      signature,
    )
    signerAddress = publicKey.toSuiAddress()
  } catch (err) {
    return { ok: false, reason: `verify: ${(err as Error).message}` }
  }

  if (normalizeSuiAddress(signerAddress) !== claimed) {
    return { ok: false, reason: 'signature does not match address' }
  }

  return { ok: true, address: claimed }
}

/** Lowercase + 0x-prefix a Sui address, or null if it isn't 0x + 64 hex. */
export function normalizeSuiAddress(address: string): string | null {
  const lower = address.trim().toLowerCase()
  if (!/^0x[0-9a-f]{64}$/.test(lower)) return null
  return lower
}

export function randomNonce(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}
