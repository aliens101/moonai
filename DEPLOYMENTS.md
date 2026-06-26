# Moon AI — Casper Testnet Deployments

Network: `casper-test` · deployer/orchestrator: **Account 4**
(`account-hash-fabe6ffa677c2360e265d1235106abb07f895661dfb4fee388b275dbf06d044c`)

| Contract | Named key | Package hash | Install tx |
|---|---|---|---|
| **Arena** | `moonai_arena` | `hash-d712361292da533be2273254c1c3a343ba008ac1be5e8d863b327a281f4c3e64` | [`ca127e3d…`](https://testnet.cspr.live/transaction/ca127e3d53f885021685a769e246cc7e3c9c753165faf5f4e3587535b3850bf6) |
| **MoonToken** (CEP-18 + CEP-3009) | `moonai_token` | `hash-2de0af130a281c820508dd3a8f55a37703021a56c587bd779ebddd2ef156f16c` | [`5c466421…`](https://testnet.cspr.live/transaction/5c466421ec0fcbc32aa35c052d5a96406f5e2e9ec893998a5bf382966ef74a12) |

## x402 settlement (verified on-chain)

The agent signs an EIP-712 authorization off-chain; the facilitator settles it via
MoonToken's CEP-3009 `transfer_with_authorization` (`bun run x402`):

| Step | Tx |
|---|---|
| fund agent (MoonToken) | [`d153f70c…`](https://testnet.cspr.live/transaction/d153f70c1f8c451229dce36931ef9c454b5bfd39f5d4f632eb1b557f5ea72472) |
| **settle (CEP-3009)** | [`441622b9…`](https://testnet.cspr.live/transaction/441622b9f2ff61db4164f271a888d8c2f691b3cad5ee8c765d0aa7710dac27c3) |

## Reproduce

```bash
cd moonai-contracts && cargo odra build      # → wasm/*.wasm (MVP, pinned nightly)
cd .. && bun install
bun run scripts/deploy.ts                     # both, or pass a name: ... Arena
bun run scripts/hashes.ts                      # read package hashes from the account
```

Deploy uses **casper-js-sdk** against the CSPR.cloud node, submitting with the
Casper 2.0 Transaction API (`putTransaction`) and lowering each wasm to the MVP
feature set via `wasm-opt`. Requires env: `CASPER_SECRET_KEY_PATH` (funded signer),
`CSPR_CLOUD_API_KEY`, `CASPER_NODE_RPC`, `CASPER_CHAIN_NAME=casper-test`.
