---
slug: cli
title: CLI
description: The moonai binary. Init an agent, chat, bridge Telegram, run the gateway.
group: Reference
order: 8
kicker: 'DOCS · REFERENCE'
voice_word: single
source: 'packages/cli'
---

# The moonai command.

The `moonai` binary owns onboarding, chat, the Telegram bridge, and the gateway daemon. Run it through Bun from the repo (`bun run moonai <command>`).

## Init

```bash
bun run moonai init
```

Generates a fresh agent wallet — a Sui address from a locally-stored Ed25519 keypair — and writes a local encrypted keystore. There is no on-chain mint, no NFT, and no operator signature required. Set your `OPENAI_API_KEY` (and any `MOONAI_LLM_*` overrides) before you start so the brain is configured.

## Chat

```bash
bun run moonai chat
```

Drops into the interactive terminal session. Ask the agent to read or act: "what's my balance?", "best stablecoin yield on Sui?", "swap 1 SUI for USDC", "supply 5 USDC to NAVI". Reads return directly. Every value-moving action runs the four-gate pipeline, and material-risk actions pause for your approval inline.

## Telegram

```bash
bun run moonai telegram setup
```

Pairs a Telegram bot so you can drive the same agent from your phone, with the same approval gates. Approval prompts arrive as inline-keyboard buttons.

## Gateway

The gateway is a long-running daemon that keeps Telegram online and routes approval prompts even when you do not have an interactive session open. It is the process that lets the agent stay reachable between chats.

## Setting the policy

The CLI reads the boundary from the environment. Set the `MOONAI_POLICY_*` variables (caps, allowlists, slippage, autonomy tier, read-only) before launching; see [Configuration](/docs/configuration) for the full list. The limits are enforced in deterministic code, so the agent cannot raise them at runtime.

Read [Configuration](/docs/configuration) next.

Source: [`packages/cli`](https://github.com/rifkyeasy/moonai/tree/main/packages/cli).
