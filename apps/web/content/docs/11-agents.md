---
slug: agents
title: For Agents
description: How AI agents (Claude Code, Codex, Cursor) install and operate Moon AI for a human. What works, what to hand back, what never to claim.
group: Reference
order: 11
kicker: 'DOCS · REFERENCE'
voice_word: honest
source: 'apps/web/content/docs/11-agents.md'
---

# An honest guide for AI agents.

You are an LLM. A human asked you to set up Moon AI. This page tells you what you can do for them, what you must hand back, and what you should never claim. The goal is fewer hallucinated steps and fewer hung scripts.

If you only read one line: **Bun is required, the brain is any OpenAI-compatible model (set `OPENAI_API_KEY`), and the fund-control policy lives in `MOONAI_POLICY_*` environment variables, not in the prompt.**

## Install

Moon AI is a Bun + Biome monorepo. Bun runs the install and the CLI.

```bash
bun install
export OPENAI_API_KEY=sk-...
bun run moonai init
bun run moonai chat
```

`init` generates a fresh agent wallet — a Sui address from a locally-stored Ed25519 keypair — and a local encrypted keystore. There is no on-chain mint, no NFT, and no operator signature required to get started.

## What you can do for the user

- Install dependencies (`bun install`) and confirm Bun is present.
- Configure the brain: set `OPENAI_API_KEY`, optionally `MOONAI_LLM_BASE_URL` and `MOONAI_LLM_MODEL` (default `gpt-4o-mini`).
- Set the fund-control policy via `MOONAI_POLICY_*` (caps, allowlists, slippage, autonomy tier, read-only). See [Configuration](/docs/configuration).
- Explain commands. The five the user runs most: `bun run moonai init`, `bun run moonai chat`, `bun run moonai telegram setup`, plus the gateway. See [CLI](/docs/cli).
- Help them ask the agent to read or act: balances, yield discovery, transfers, Cetus / DeepBook swaps, NAVI / Scallop supply/withdraw. See [Tools](/docs/tools).

## How the safety model works (so you do not fight it)

Every value-moving action runs through a four-gate pipeline: policy (pure, unit-tested), simulation (dry-run before gas), an approval floor (material-risk actions prompt a human even under YOLO), and execution (broadcast plus receipt). The model proposes; deterministic code disposes.

You cannot raise a limit, skip a simulation, or grant approval from the model. Those decisions live in code. Do not write scripts that try to route around them.

## Anti-patterns to avoid

- **Do NOT** tell the user the model can override a policy limit. It cannot. The limits are in code.
- **Do NOT** invent on-chain identity ceremonies. The identity is just a Sui address from a local Ed25519 keypair; there is no mint, no NFT, no registry, no naming claim required to start.
- **Do NOT** default to mainnet for exploratory work. Use Sui testnet first, then move to Sui mainnet once the policy is set.
- **Do NOT** script destructive actions (large transfers, withdrawals) without having the user confirm. Material-risk actions will pause for approval anyway; respect that.

## Networks

| Network | RPC | Explorer |
|---|---|---|
| Sui mainnet | `https://fullnode.mainnet.sui.io:443` | `https://suiscan.xyz` |
| Sui testnet | `https://fullnode.testnet.sui.io:443` | `https://suiscan.xyz/testnet` |

Gas token is SUI (9 decimals; smallest unit is MIST, 1 SUI = 1e9 MIST). Sui does not use numeric Sui chain IDs.

## Machine-readable surfaces

- [/llms.txt](/llms.txt): index with one bullet per doc. Fetch this first.
- [/llms-full.txt](/llms-full.txt): a single-file dump of every doc plus the repo README.
- [/docs/<slug>.md](/docs/agents.md): raw markdown per page (for example `/docs/quickstart.md`, `/docs/cli.md`).

Always re-fetch before relying on cached prior advice.
