---
slug: architecture
title: Architecture
description: A Bun monorepo. An advisory brain, a deterministic control layer, and a four-gate write pipeline on Sui.
group: Concepts
order: 3
kicker: 'DOCS · CONCEPTS'
voice_word: deterministic
source: 'README.md'
---

# An advisory brain, a deterministic boundary.

Moon AI splits an agent into two layers that never trade places. The advisory layer (the AI) decides what to do. The control layer (deterministic code) decides whether it is allowed to happen. Every value-moving action crosses the same four gates before it touches the chain.

```
        ┌───────────┐     ┌────────────┐     ┌─────────────┐     ┌──────────┐
intent →│  POLICY   │ ──▶ │  SIMULATE  │ ──▶ │  APPROVAL   │ ──▶ │ EXECUTE  │ → receipt
        │ (pure fn) │     │ (dry-run)  │     │ (if risky)  │     │ + verify │
        └───────────┘     └────────────┘     └─────────────┘     └──────────┘
         hard caps,        dryRunTx /          material-risk       broadcast PTB +
         allowlists,       devInspect          actions prompt      wait for
         autonomy tier     aborts doomed tx    EVEN IN yolo        on-chain effects
```

## The four gates

Every value-moving tool call (`sui.send`, `cetus.swap`, `navi.supply` / `withdraw`, `scallop.*`, `walrus.store`) goes through the same pipeline:

1. **Policy** (`evaluatePolicy`, pure and unit-tested): hard caps on native and coin amounts, recipient and coin-type allowlists, slippage caps, and an autonomy tier. A violation blocks the action; an in-cap but material-risk action is flagged for approval. No network, no model, fully auditable. The on-chain `moonai::policy` Move package, deployed on Sui mainnet, anchors these controls.
2. **Simulate**: the PTB is dry-run with `dryRunTransactionBlock` / `devInspect` before any gas is spent; a failure aborts with a decoded reason.
3. **Approval floor**: the policy verdict sits beneath the session permission mode, so a material-risk action prompts for human approval even under YOLO / auto, and is denied outright under `strict`. Fund controls in code, not in the model.
4. **Execute**: broadcast on Sui as a PTB, wait for the effects, return a decision record (policy verdict plus simulated gas plus tx digest).

## The monorepo

A Bun + Biome monorepo:

```
packages/
  core              brain (OpenAI-compatible), local file memory + index,
                    permission service + approval floor, plugin host, identity
  plugin-onchain    the Sui limbs: policy engine, simulation, transfers,
                    DeepBook / Cetus / Turbos swaps (best-route), NAVI / Suilend /
                    Scallop lending, Walrus receipts, DeFiLlama discovery,
                    object/Move-call read/analysis
  plugin-system     OS-sandboxed shell / code / file / web / browser tools
  plugin-telegram   Telegram listener + inline-keyboard approvals
  gateway           long-running daemon (keeps Telegram online, routes approvals)
  cli               the `moonai` binary (init, chat, telegram, gateway, ...)
apps/
  web               Next.js console + docs site
```

## The runtime

- **Brain**: any OpenAI-compatible model (default `gpt-4o-mini`), swappable via environment variable.
- **Storage**: local files — the agent's memory notes plus an index, on the operator's machine.
- **Chain I/O**: [`@mysten/sui`](https://sdk.mystenlabs.com/typescript) (the Sui TypeScript SDK) for every read and write; [zod](https://zod.dev) tool schemas.
- **Surfaces**: a terminal TUI, a Telegram bridge, and the web console. A request from any surface runs the identical pipeline.

The policy engine, approval floor, simulation guards, and the DeFiLlama discovery logic are covered by deterministic unit tests (no network, injected fetch), so the safety boundary is verifiable in CI.

## Sui specifics

- **Sui mainnet** · RPC `https://fullnode.mainnet.sui.io:443` · explorer `https://suiscan.xyz`
- **Sui testnet** · RPC `https://fullnode.testnet.sui.io:443` · explorer `https://suiscan.xyz/testnet`
- Native SUI has 9 decimals; the smallest unit is MIST (1 SUI = 1e9 MIST). Sui uses object identifiers, not numeric Sui chain IDs.
- Gas token: SUI. Execution and settlement happen on Sui; official Move packages, object types, and RPC data are used for all writes, and the `moonai::policy` package is deployed on Sui mainnet.

Read [Identity](/docs/identity) next.

Source: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
