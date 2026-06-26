---
slug: quickstart
title: Quickstart
description: Install, configure the brain, init, chat. From zero to a policy-gated agent in a few commands.
group: Get started
order: 2
kicker: 'DOCS · GET STARTED'
voice_word: live
source: 'README.md'
---

# Run your first policy-gated agent.

There are two ways in. **Try it in 30 seconds** in the browser, or **run your own agent** from the command line.

## Fastest: the hosted console (no setup)

Open the [console](/console) and start typing. Asking about balances, yields, prices, or swap quotes needs **no wallet, no key, no install** — the brain and the Sui connection are already wired.

Want it personal? **Connect your wallet** so "my balance / my portfolio" answers for your address, and **sign in** (one signature) to save your chat history across devices and to authorize transfers (owner-only, simulated, policy-capped). That's the whole setup. See [Console](/docs/console).

The rest of this page is for running your **own** agent — your keys, your limits, on your machine or server.

## Prerequisites (self-hosted)

[Bun](https://bun.sh). The monorepo and CLI run on Bun.

An OpenAI-compatible LLM key. The brain is any OpenAI-compatible model; the default is `gpt-4o-mini`. You can point it at any base URL and model via environment variables.

A little SUI to pay gas for the actions you ask the agent to take.

## Install and configure

```bash
bun install

# Configure the brain (OpenAI-compatible; any base URL / model works)
export OPENAI_API_KEY=sk-...
# optional overrides:
# export MOONAI_LLM_BASE_URL=https://api.openai.com/v1
# export MOONAI_LLM_MODEL=gpt-4o-mini
```

## Init

```bash
bun run moonai init
```

`init` generates an agent wallet — a Sui address derived from a locally-stored Ed25519 keypair — and writes a local encrypted keystore. There is no on-chain mint, no NFT, and no operator signature required to get started.

## Set the policy

Configure the boundary entirely from the environment. These limits live in deterministic, unit-tested code; the model cannot raise them at runtime.

```bash
MOONAI_POLICY_MAX_NATIVE_SUI=2.0          # hard cap: block sends over 2 SUI
MOONAI_POLICY_AUTO_MAX_NATIVE_SUI=0.1     # auto-execute up to 0.1 SUI; above this requires approval
MOONAI_POLICY_MAX_SLIPPAGE_BPS=100        # block swaps over 1% slippage
MOONAI_POLICY_AUTONOMY=auto               # auto | confirm | readonly
MOONAI_POLICY_RECIPIENT_ALLOWLIST=0xabc...,0xdef...   # Sui addresses (0x + 64 hex)
MOONAI_POLICY_TOKEN_ALLOWLIST=0x...::usdc::USDC,...   # Sui coin types
MOONAI_POLICY_READONLY=1                  # reject all writes
```

## Chat

```bash
bun run moonai chat
```

Fund the agent wallet with a little SUI for gas, set your `MOONAI_POLICY_*` limits, and ask it to do things: "what's my balance?", "best stablecoin yield on Sui?", "swap 1 SUI for USDC", "supply 5 USDC to NAVI". Reads run freely. Every value-moving action runs the four-gate pipeline (policy, simulate, approval, execute) before it broadcasts as a PTB, and material-risk actions pause for your approval.

## Telegram

Run the same agent, with the same approval gates, from your phone:

```bash
bun run moonai telegram setup
```

Approval prompts arrive as inline-keyboard buttons.

Read [Architecture](/docs/architecture) next to understand how the pipeline fits together.

Source: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
