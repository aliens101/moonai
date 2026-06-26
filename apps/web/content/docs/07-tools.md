---
slug: tools
title: Tools
description: The Sui limbs plus the host harness. Reads run freely; every write crosses the gates.
group: Concepts
order: 7
kicker: 'DOCS · CONCEPTS'
voice_word: gated
source: 'packages/plugin-onchain'
---

# Limbs that do, gates that decide.

Tools do literal work, never safety logic. The brain decides which tool to call; the deterministic control layer decides whether a value-moving call is allowed. Reads are free. Every write (`sui.send`, `cetus.swap`, `navi.supply` / `withdraw`, `scallop.*`, `walrus.store`) goes through policy, simulation, and approval first.

## On-chain tools (plugin-onchain)

| Area | Tools | Notes |
|---|---|---|
| Wallet / account | `account.info`, `sui.balance` | Identity plus coin snapshot plus activity; native SUI (MIST) position. |
| Balances / coins | `sui.balance`, `tokens.info` | Coin-type discovery across owned objects (no curated list). |
| Transfers | `sui.send` | Native SUI and any Sui coin type; recipients are Sui addresses (0x + 64 hex). |
| Trading | `cetus.quote`, `cetus.swap`, `deepbook.markets` | Cetus and Turbos (concentrated-liquidity AMMs) plus DeepBook's native CLOB. Quotes compare venues and route to the better one. |
| Lending | `navi.*`, `scallop.*` | NAVI, Suilend, and Scallop: live supply / borrow rates, supply / withdraw collateral, borrow / repay; receipts report the health factor. |
| Staking | `haedal.stake`, `springsui.stake` | Liquid staking of SUI via Haedal and SpringSui. |
| Discovery | `defi.yields` | DeFiLlama analytics: Sui pools ranked by APY / TVL with risk and RWA flags (read-only). |
| Risk | `risk.token` | Pre-trade vet: can you exit it (live Cetus / DeepBook quote), liquidity depth, restricted-RWA flag, real-package check, into a low / elevated / high verdict. |
| Controls | `policy.show`, `policy.create`, `tx.simulate` | Report or set the active fund-control policy; dry-run any PTB (would-succeed plus gas, or decoded failure) without broadcasting. |
| Receipts | `walrus.store` | Persist auditable memory and execution receipts to Walrus, addressed by root hash. |
| Analysis | `sui.tx`, `sui.object`, `sui.activity` | Decode tx, introspect objects and Move packages, recent transfers. |
| Blockchain | `sui.checkpoint`, `sui.gas` | Latest checkpoint, timestamp, reference gas price plus estimated SUI cost of common ops. |
| Generic | `sui.read`, `move.call` | Any Move function by package / module / function plus `args`. |

Source: [`packages/plugin-onchain`](https://github.com/rifkyeasy/moonai/tree/main/packages/plugin-onchain).

## RWA and restricted awareness

`defi.yields` surfaces every Sui pool but flags restricted RWA and tokenized yield products (for example Ondo's offerings) so the agent only proposes entering them with explicit eligibility confirmation. DeFiLlama is used for discovery and analytics only, never execution.

## Host harness (plugin-system)

The agent also has a general-purpose toolkit for the work around the chain: OS-sandboxed shell and code execution, file operations, web fetch, and a headless browser. These run on the operator's machine under the OS sandbox.

Source: [`packages/plugin-system`](https://github.com/rifkyeasy/moonai/tree/main/packages/plugin-system).

## Telegram (plugin-telegram)

A Telegram listener turns inbound DMs into agent events. Approval prompts arrive as inline-keyboard buttons, so the same boundary applies whether you drive the agent from the terminal or your phone.

Source: [`packages/plugin-telegram`](https://github.com/rifkyeasy/moonai/tree/main/packages/plugin-telegram).

## Approval modes

The session permission mode controls how much the agent does without prompting, but the approval floor sits beneath it. A material-risk action prompts for a human even when the session is in `auto` / YOLO, and is denied outright under `strict` and read-only. Configure it with `MOONAI_POLICY_AUTONOMY` and the rest of the `MOONAI_POLICY_*` variables. See [Configuration](/docs/configuration).

Read [CLI](/docs/cli) next.

Source: [`packages/plugin-onchain`](https://github.com/rifkyeasy/moonai/tree/main/packages/plugin-onchain).
