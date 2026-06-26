# moonai web console

The browser surface for [moonai](../../README.md) — a Sui-native, policy-aware
AI treasury agent. Live at **[moonaiai.space](https://moonaiai.space)**.

A Next.js 15 app with three parts:

- **Chat console** (`/console`) — prompt moonai in plain English. It answers with
  **live on-chain data** (balances, portfolio, gas, yields, swap quotes, moonai::policy
  lookups) and **executes** from your own wallet: transfers, wrap/unwrap, **swap**
  (OpenOcean → DeepBook / Cetus), **Scallop** lend/borrow/repay/withdraw. Every
  value-moving action is policy-capped, prepared server-side, and **signed by your
  connected wallet** — the server holds no key. Per-wallet chat history syncs
  server-side when you sign in.
- **Agents** (`/console/agents`) — the moonai::policy identities your wallet owns:
  agent card, reputation, validations.
- **Docs** (`/docs`, `/llms.txt`) — the documentation site.

Plus a **derived agent wallet**: sign once to derive a deterministic wallet (the
same one the CLI derives from your operator wallet) and let it sign autonomously
within policy, or keep per-tx signing with your main wallet.

## Setup

```bash
cp .env.local.example .env.local   # then fill it in
npm install                        # standalone — no workspace deps
npm run dev                        # http://localhost:3210
```

Environment (`.env.local`):

| Var | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | LLM brain for `/api/chat` (any OpenAI-compatible; `MOONAI_LLM_BASE_URL`/`MOONAI_LLM_MODEL` optional) |
| `SESSION_SECRET` | iron-session signing key for Sui sign-in (≥32 chars; `openssl rand -hex 32`) |
| `MOONAI_POLICY_MAX_NATIVE_MNT` | per-tx native-SUI policy cap (default 25) |

Writes are signed client-side, so **no signer key lives on the server**.

## Build & deploy

```bash
npm run build      # next build
npm run start      # next start -p 3210
```

Production runs on a plain Node host under pm2. [`scripts/deploy-web.sh`](../../scripts/deploy-web.sh)
mirrors `origin/main`, installs the web deps in isolation from the bun workspace,
builds to a temp dir + atomically swaps it in (so chunks never 404 mid-deploy),
and restarts pm2. The [`deploy-web`](../../.github/workflows/deploy-web.yml) workflow
runs it over SSH automatically on every push that touches `apps/web/**`.

## Notes

- **Standalone**: this app has zero `moonai-ai-*` workspace imports, so it builds
  with plain `npm` on a Node host (no bun required). Chain I/O via /sui//dapp-kit.
- The agent-wallet derivation is byte-identical to the CLI
  ([`packages/cli/src/profile/derive.ts`](../../packages/cli/src/profile/derive.ts)),
  so web and CLI resolve to the same wallet.
