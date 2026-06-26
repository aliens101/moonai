---
slug: memory
title: Memory
description: Local files — markdown notes plus an index, kept on the operator's machine. No database, nothing uploaded.
group: Concepts
order: 5
kicker: 'DOCS · CONCEPTS'
voice_word: local
source: 'README.md'
---

# A local, content-addressed memory.

Moon AI keeps a persistent memory on the operator's machine. It is just files — typed markdown notes plus an index — written next to the agent the CLI created. There is no database and no remote storage layer; nothing is uploaded.

## What it stores

The agent writes typed markdown notes plus an index of them. The index is the canonical entry point; the agent reads it to decide which notes to open in full. This keeps the model's working context small while still letting it recall facts it has learned across sessions.

Practical examples of what lands in memory:

- Operator preferences and instructions worth keeping between sessions.
- Facts the agent has confirmed about your treasury or the protocols it works with.
- References to external systems it has been pointed at.

## Why local

Memory is observability and recall, not a safety boundary. Keeping it local keeps the data on your machine and keeps the design honest: nothing about memory can move funds. The thing that can move funds is the policy-gated write pipeline, and that is governed entirely by the deterministic control layer described in [Architecture](/docs/architecture).

## Reading it back

Because memory is plain files on your machine, you can open or edit it directly — what the agent stored is exactly what you see, no special viewer required. The agent reads the index first, then opens only the notes it needs, keeping its working context small.

Read [Brain](/docs/brain) next.

Source: [`README.md`](https://github.com/rifkyeasy/moonai/blob/main/README.md).
