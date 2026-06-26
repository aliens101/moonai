---
slug: console
title: Console
description: Chat with your treasury in the browser. Ask in plain English; get live on-chain answers. Reads need nothing; signing in adds saved history and owner-gated transfers.
group: Operate
order: 10
kicker: 'DOCS · OPERATE'
voice_word: browser
source: 'apps/web/app/console'
---

# Chat with your treasury, in the browser.

The console at [/console](/console) is moonai as a chat. Ask plain-English questions about your money on Sui and it answers with **live on-chain data** — and when you ask it to move funds, deterministic code (not the AI) enforces the limits.

## What you need to set up

Almost nothing to start.

1. **Open [/console](/console) and type.** Reads — balances, gas, yields, prices, swap quotes — work with **no wallet and no sign-in**. The brain and the on-chain connection are already wired for you.
2. **Connect your wallet** (top-right) when you want moonai to know which wallet is "yours". Now "what's my balance / my portfolio" just answers for your address — no pasting addresses.
3. **Sign in** (one signature) when you want to:
   - **save your chat history** to your wallet and sync it across devices, and
   - **authorize transfers** — only the signed-in owner can move funds, and only within policy.

No API key, no install. (Want to run it yourself with your own keys and limits? See the [Quickstart](/docs/quickstart) and [CLI](/docs/cli).)

Reads need nothing. Anything that moves funds is **prepared by moonai, then signed by your own connected wallet** — you see a "Confirm in wallet" button and your wallet pops up to approve. The server never holds your key. A policy cap is enforced before anything can be prepared.

- **Portfolio & positions** — "what's my portfolio worth?", "what does `0x…` hold?"
- **Yields** — "best stablecoin yield on Sui right now?"
- **Swap** — "swap 0.01 SUI to USDC" — routed across Sui venues (Cetus, Turbos, DeepBook) with slippage protection, then you sign it.
- **Transfer & stake** — "send 0.01 SUI to `0x…`", "send 5 USDC to `0x…`", "liquid-stake 0.1 SUI via Haedal" (Sui addresses are 0x + 64 hex).
- **Lend & borrow** — "supply 5 USDC to NAVI", "withdraw all my USDC", "borrow 2 USDC", "repay all my debt" (NAVI / Suilend / Scallop).
- **Receipts** — "store this decision record to Walrus"

New here? Tap the **template menu** (the ☰ left of the input) for one-tap starters, grouped by activity: Yields, Swap, Transfer & stake, Lend & borrow, Portfolio & positions.

## Your chats are saved

Every conversation is kept. **Signed in**, your history lives on the server keyed to your wallet, so it follows you across devices and browsers. **Signed out**, it's saved in this browser. The sidebar lists past chats — switch between them, or delete one. "New chat" starts fresh. Disconnecting your wallet simply hides that wallet's chats; they come back when you reconnect.

## Is it safe?

The AI only **advises**. Every value-moving action goes through deterministic, policy-checked code, is **capped** by a hard per-transaction limit the model can't raise, and is then **signed by your own wallet** — moonai prepares the transaction, but nothing moves until you approve it in your wallet, and the server never holds your key. Reads can never move funds. So you can explore freely and stay fully in control of anything that touches money.

## Your agents

[/console/agents](/console/agents) lists the agent wallets tied to your account — each is just a Sui address derived from a local Ed25519 keypair, with its balances, recent activity, and active policy. There is no registry, no NFT, and no mint; connect and sign in to load them.

Read the [Quickstart](/docs/quickstart) to run your own agent, or [Introduction](/docs/introduction) for the bigger picture.

Source: [`apps/web/app/console`](https://github.com/rifkyeasy/moonai/tree/main/apps/web/app/console).
