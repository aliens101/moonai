---
slug: identity
title: Identity
description: The agent is a Sui address derived from a local Ed25519 keypair, kept in an encrypted keystore. No on-chain mint required to start.
group: Concepts
order: 4
kicker: 'DOCS · CONCEPTS'
voice_word: simple
source: 'README.md'
---

# A plain wallet, an enforced boundary.

The agent's identity is just a Sui address, derived from a locally-stored Ed25519 keypair. `moonai init` generates a fresh agent wallet and writes a local encrypted keystore. There is no on-chain mint, no NFT, and no operator signature required to get started; the identity is just an address that holds SUI and signs the transactions the agent is allowed to send.

## The agent wallet

The agent wallet is the Sui address that pays gas and is the sender of every write the agent executes. Fund it with a little SUI and the agent can transact within the limits you set. The private key is stored locally in an encrypted keystore, never sent to the model and never required to live anywhere but the operator's machine.

## What actually constrains the agent

The identity is deliberately boring. The interesting part is the boundary around it: the policy engine. What the agent can do with its wallet is decided entirely by deterministic configuration, not by the address itself.

| Control | Configured by | Effect |
|---|---|---|
| Hard caps | `MOONAI_POLICY_MAX_NATIVE_SUI`, slippage caps | Block any action over the limit. |
| Allowlists | `MOONAI_POLICY_RECIPIENT_ALLOWLIST`, `MOONAI_POLICY_TOKEN_ALLOWLIST` | Restrict recipients and tokens. |
| Autonomy tier | `MOONAI_POLICY_AUTONOMY` (`auto` / `confirm` / `readonly`) | How much the agent may do without a prompt. |
| Read-only | `MOONAI_POLICY_READONLY` | Reject all writes outright. |

These live in code and environment, so the boundary is the same whether the request arrives from the terminal, Telegram, or the web console.

## Sui networks

- Sui mainnet, RPC `https://fullnode.mainnet.sui.io:443`, explorer `https://suiscan.xyz`.
- Sui testnet, RPC `https://fullnode.testnet.sui.io:443`, explorer `https://suiscan.xyz/testnet`.

Start on Sui testnet for exploratory work, then move to mainnet once your policy is set the way you want it.

Read [Memory](/docs/memory) next.

Source: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
