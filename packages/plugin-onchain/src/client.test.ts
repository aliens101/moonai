import { describe, expect, test } from 'bun:test'
import { PublicKey } from 'casper-js-sdk'
import { accountHashOf, accountNamedKeys, txLink } from './client'

describe('txLink (unit)', () => {
  test('formats a testnet explorer link', () => {
    expect(txLink('deadbeef')).toBe('https://testnet.cspr.live/transaction/deadbeef')
  })
})

describe('accountHashOf (unit)', () => {
  test('derives the known Account 4 account-hash from its public key', () => {
    const pub = PublicKey.fromHex(
      '0203684aa256a6e48c4d3bb2909cff9f71d6f7c52c96b549d19b09fd298600cfba6b',
    )
    expect(accountHashOf(pub)).toBe(
      'account-hash-fabe6ffa677c2360e265d1235106abb07f895661dfb4fee388b275dbf06d044c',
    )
  })
})

// Integration: reads the deployed contracts from the live node. Opt-in:
//   RUN_CHAIN_TESTS=1 bun test
const CHAIN = process.env.RUN_CHAIN_TESTS === '1'
const chainSuite = CHAIN ? describe : describe.skip
chainSuite('deployment (integration, live RPC)', () => {
  test('Arena + MoonToken named keys exist on the deployer account', async () => {
    const names = (
      await accountNamedKeys(
        '0203684aa256a6e48c4d3bb2909cff9f71d6f7c52c96b549d19b09fd298600cfba6b',
      )
    ).map((k) => k.name)
    expect(names).toContain('moonai_arena')
    expect(names).toContain('moonai_token')
  }, 30000)
})
