---
slug: configuration
title: Configuration
description: Configure the brain and the fund-control policy entirely from the environment. No code changes.
group: Reference
order: 9
kicker: 'DOCS · REFERENCE'
voice_word: typed
source: 'README.md'
---

# Configured from the environment.

The brain and the entire fund-control policy are configured from environment variables. No code changes are needed to change a limit, and nothing the model outputs can override them, because the policy is enforced in deterministic, unit-tested code.

## Brain

```bash
export OPENAI_API_KEY=sk-...
# optional overrides:
export MOONAI_LLM_BASE_URL=https://api.openai.com/v1   # any OpenAI-compatible endpoint
export MOONAI_LLM_MODEL=gpt-4o-mini                    # default model
```

Any OpenAI-compatible model works. Swapping the model has no effect on the safety boundary.

## Policy

```bash
MOONAI_POLICY_MAX_NATIVE_SUI=2.0          # hard cap: block sends over 2 SUI
MOONAI_POLICY_AUTO_MAX_NATIVE_SUI=0.1     # auto-execute up to 0.1 SUI; above this requires approval
MOONAI_POLICY_MAX_SLIPPAGE_BPS=100        # block swaps over 1% slippage
MOONAI_POLICY_AUTONOMY=auto               # auto | confirm | readonly
MOONAI_POLICY_RECIPIENT_ALLOWLIST=0xabc...,0xdef...   # Sui addresses (0x + 64 hex)
MOONAI_POLICY_TOKEN_ALLOWLIST=0x...::usdc::USDC,...   # Sui coin types
MOONAI_POLICY_READONLY=1                  # reject all writes
```

| Variable | Controls |
|---|---|
| `MOONAI_POLICY_MAX_NATIVE_SUI` | Hard cap on native SUI per action. A value above this blocks. |
| `MOONAI_POLICY_AUTO_MAX_NATIVE_SUI` | The amount the agent may move without prompting. Above it, approval is required. |
| `MOONAI_POLICY_MAX_SLIPPAGE_BPS` | Maximum allowed swap slippage, in basis points. |
| `MOONAI_POLICY_AUTONOMY` | `auto` (act within tier), `confirm` (prompt on writes), `readonly` (no writes). |
| `MOONAI_POLICY_RECIPIENT_ALLOWLIST` | Comma-separated recipient Sui addresses the agent may send to. |
| `MOONAI_POLICY_TOKEN_ALLOWLIST` | Comma-separated Sui coin types the agent may touch. |
| `MOONAI_POLICY_READONLY` | When set, all writes are rejected outright. |

The approval floor sits beneath the autonomy tier: a material-risk action prompts for a human even under `auto` / YOLO, and is denied under `readonly` / strict.

## Networks

| Network | RPC | Explorer |
|---|---|---|
| Sui mainnet | `https://fullnode.mainnet.sui.io:443` | `https://suiscan.xyz` |
| Sui testnet | `https://fullnode.testnet.sui.io:443` | `https://suiscan.xyz/testnet` |

Gas token is SUI (9 decimals; smallest unit is MIST, 1 SUI = 1e9 MIST). Sui does not use numeric Sui chain IDs. Start on Sui testnet for exploratory work, then move to mainnet once your policy is set.

Read [Console](/docs/console) next.

Source: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
