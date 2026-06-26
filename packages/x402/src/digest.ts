/**
 * EIP-712 `transfer_with_authorization` digest for the x402 "exact" scheme on Casper.
 *
 * Reproduces `MoonToken`'s on-chain digest (CEP-3009 / casper-eip-712 Casper-native
 * domain) BYTE-FOR-BYTE so a payer can sign off-chain and the facilitator can settle
 * on-chain. Verified against the contract's `eip712_digest_vector` Rust test.
 *
 *   digest = keccak256(0x19 || 0x01 || domainSeparator || structHash)
 */
import { keccak_256 } from '@noble/hashes/sha3'

const utf8 = new TextEncoder()

function k(data: Uint8Array): Uint8Array {
  return keccak_256(data)
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let off = 0
  for (const p of parts) {
    out.set(p, off)
    off += p.length
  }
  return out
}

/** EIP-712 `uint256`: 32-byte big-endian. */
function uint256(value: bigint): Uint8Array {
  const out = new Uint8Array(32)
  let v = value
  for (let i = 31; i >= 0 && v > 0n; i--) {
    out[i] = Number(v & 0xffn)
    v >>= 8n
  }
  return out
}

/** EIP-712 `encodeAddress` for a Casper key: keccak256(0x00 || account_hash[32]). */
function encodeAddress(accountHash: Uint8Array): Uint8Array {
  return k(concat(new Uint8Array([0x00]), accountHash))
}

export interface Domain {
  name: string
  version: string
  chainName: string
  /** the token's 32-byte contract package hash */
  packageHash: Uint8Array
}

export interface TransferAuthorization {
  /** payer 32-byte account hash */
  from: Uint8Array
  /** payee 32-byte account hash */
  to: Uint8Array
  value: bigint
  validAfter: bigint
  validBefore: bigint
  /** 32-byte single-use nonce */
  nonce: Uint8Array
}

export function domainSeparator(d: Domain): Uint8Array {
  const typeHash = k(
    utf8.encode(
      'EIP712Domain(string name,string version,string chain_name,bytes32 contract_package_hash)',
    ),
  )
  return k(
    concat(
      typeHash,
      k(utf8.encode(d.name)),
      k(utf8.encode(d.version)),
      k(utf8.encode(d.chainName)),
      d.packageHash,
    ),
  )
}

export function structHash(a: TransferAuthorization): Uint8Array {
  const typeHash = k(
    utf8.encode(
      'TransferWithAuthorization(address from,address to,uint256 value,uint256 validAfter,uint256 validBefore,bytes32 nonce)',
    ),
  )
  return k(
    concat(
      typeHash,
      encodeAddress(a.from),
      encodeAddress(a.to),
      uint256(a.value),
      uint256(a.validAfter),
      uint256(a.validBefore),
      a.nonce,
    ),
  )
}

/** The full EIP-712 digest the payer signs and the contract verifies. */
export function transferWithAuthorizationDigest(
  domain: Domain,
  auth: TransferAuthorization,
): Uint8Array {
  return k(
    concat(new Uint8Array([0x19, 0x01]), domainSeparator(domain), structHash(auth)),
  )
}

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
