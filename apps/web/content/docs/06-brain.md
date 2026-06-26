---
slug: brain
title: Brain
description: Any OpenAI-compatible model. Advisory only, never the safety boundary.
group: Concepts
order: 6
kicker: 'DOCS · CONCEPTS'
voice_word: advisory
source: 'README.md'
---

# An advisory brain you can swap.

The brain is any OpenAI-compatible model. The default is `gpt-4o-mini`. Point it at a different base URL or model with environment variables and nothing else changes, because the model never gets to be the safety boundary.

```bash
export OPENAI_API_KEY=sk-...
# optional overrides:
export MOONAI_LLM_BASE_URL=https://api.openai.com/v1
export MOONAI_LLM_MODEL=gpt-4o-mini
```

## What the brain does

The brain is the advisory layer. It reads the operator's intent, picks tools, explains tradeoffs, and discovers opportunities. It proposes actions; it does not authorize them.

## What the brain cannot do

It cannot raise a policy limit, skip a simulation, or grant its own approval. Those decisions are made by deterministic code in the control layer, which sits beneath the model and is unaffected by anything the model outputs. A jailbreak or a confused tool call still hits a hard cap, a simulation, and an approval floor before any value moves. See [Architecture](/docs/architecture) for the four-gate pipeline.

## How a turn happens

1. The brain receives the operator's message plus the relevant memory index.
2. It decides whether to read (free) or to propose a value-moving action.
3. Reads return results directly. A proposed write is handed to the policy engine, simulated, and (if material-risk) held for approval before execution.
4. Cleared writes broadcast on Sui as a PTB and return a decision record (policy verdict, simulated gas, and tx digest) the brain can report back.

Because the boundary lives in code, swapping the model is a one-line change with no impact on safety. A worse model can be wrong about what to do, but it cannot get past the gates.

Read [Tools](/docs/tools) next.

Source: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
