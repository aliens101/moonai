import { describe, expect, test } from 'bun:test'
import { toHex, transferWithAuthorizationDigest } from './digest'

const fill = (b: number) => new Uint8Array(32).fill(b)

describe('EIP-712 transfer_with_authorization digest (unit)', () => {
  // The expected value comes from MoonToken's on-chain `eip712_digest_vector` Rust
  // test (moonai-contracts/src/token.rs). If the TS encoding ever drifts from the
  // contract, this fails — guaranteeing off-chain signatures verify on-chain.
  test('matches the on-chain Rust vector byte-for-byte', () => {
    const digest = transferWithAuthorizationDigest(
      {
        name: 'Moon AI Token',
        version: '1',
        chainName: 'casper:casper-test',
        packageHash: fill(0x11),
      },
      {
        from: fill(0x22),
        to: fill(0x33),
        value: 1000n,
        validAfter: 0n,
        validBefore: 1_000_000n,
        nonce: fill(0x44),
      },
    )
    expect(toHex(digest)).toBe(
      '593a8a415f9f8b0bc735674c0307a848c5f78c093b9b6b495cd99eb19ba6b0a0',
    )
  })
})
