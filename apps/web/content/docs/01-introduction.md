---
slug: introduction
title: Introduction
description: A Sui-native, policy-aware AI treasury assistant. The AI advises; deterministic code enforces the fund controls.
group: Get started
order: 1
kicker: 'DOCS · GET STARTED'
voice_word: policy-aware
source: 'README.md'
---

# An AI agent you can trust with a wallet.

Moon AI is an AI agent that does real on-chain work on Sui, check balances, transfer, swap, lend, stake, and discover yield, from your terminal, Telegram, or a web console. What makes it more than a chatbot with a wallet is the part the AI cannot override: every value-moving action is checked against a deterministic policy, dry-run simulated, and (when material-risk) held for human approval before it is broadcast as a PTB. The model proposes; code disposes.

The pitch in one line: an AI treasury operator you can actually trust with a wallet, because the spending limits, allowlists, and approval gates live in auditable code, not in a prompt the model could rationalize its way around.

## Why this design

LLMs are good at deciding what to do and bad at being a safety boundary. A jailbreak, a confused tool call, or a hallucinated "the user said it was fine" should never be the only thing standing between an agent and your treasury. So Moon AI splits the two.

| Layer | Who | What it owns |
|---|---|---|
| Advisory | The AI | Understands intent, picks tools, explains tradeoffs, discovers opportunities. |
| Control | Deterministic code | A pure policy engine, pre-flight simulation, and an approval floor the model has no way to bypass. |

This is the defensible core: unified risk analysis, RWA-eligibility awareness, transaction simulation, enforceable policy controls, approvals, and auditable execution. It is not a generic chatbot and not an APY-ranking bot.

## What it does today

Balances and tokens, transfers (native SUI and any Sui coin type), trading via Cetus and Turbos plus DeepBook's native CLOB (best-route comparison), lending via NAVI, Suilend, and Scallop, liquid staking via Haedal and SpringSui, yield discovery via DeFiLlama (read-only analytics with risk signals and RWA-eligibility flags for restricted RWA and tokenized yield products), and on-chain analysis with arbitrary object and Move call inspection.

The brain is any OpenAI-compatible model (default `gpt-4o-mini`), swappable by environment variable. Memory is plain files on the operator's machine. Chain I/O goes through `@mysten/sui` (the Sui TypeScript SDK). Execution and settlement happen on Sui.

## Who this is for

If you want an autonomous agent that can operate a treasury, propose and execute on-chain actions, and surface opportunities, but whose spending boundary you can read, test, and enforce in code, Moon AI is the path. Read [Quickstart](/docs/quickstart) next.

## How the docs are organized

Four groups. Get started covers install and a first chat. Concepts walks the four-gate write pipeline and the tool model. Reference is the CLI surface and the config shape. Operate covers the operator console at `/console`.

Source for everything in this section: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
