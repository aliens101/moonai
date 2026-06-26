import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { NextRequest } from 'next/server'
import { type Doc, getDoc, listDocs, listSlugs } from '@/lib/docs'

export const runtime = 'nodejs'
export const dynamic = 'force-static'

export async function generateStaticParams() {
  const slugs = await listSlugs()
  return [
    { path: [] },
    { path: ['full'] },
    ...slugs.map(slug => ({ path: ['docs', slug] })),
  ]
}

const SITE_ORIGIN = 'https://moonai.xyz'
const REPO_BASE = 'https://github.com/rifkyeasy/moonai/blob/main/'

const TEXT_HEADERS = {
  'Content-Type': 'text/plain; charset=utf-8',
  'Cache-Control': 'public, max-age=300, s-maxage=3600, stale-while-revalidate=86400',
  'X-MoonAi-Source': 'docs-llms',
}

const FULL_ORDER = [
  'agents',
  'quickstart',
  'configuration',
  'cli',
  'brain',
  'tools',
  'memory',
  'architecture',
  'identity',
  'console',
  'introduction',
]

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
) {
  const { path: parts = [] } = await context.params

  if (parts.length === 0) {
    return text(await renderLlmsIndex())
  }
  if (parts.length === 1 && parts[0] === 'full') {
    return text(await renderLlmsFull())
  }
  if (parts.length === 2 && parts[0] === 'docs') {
    const body = await renderDocRaw(parts[1])
    if (body === null) return notFound()
    return text(body)
  }
  return notFound()
}

function text(body: string): Response {
  return new Response(body, { status: 200, headers: TEXT_HEADERS })
}

function notFound(): Response {
  return new Response('not found\n', {
    status: 404,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

async function renderLlmsIndex(): Promise<string> {
  const docs = await listDocs()
  const docBullets = docs
    .map(
      d =>
        `- [${d.frontmatter.title}](${SITE_ORIGIN}/docs/${d.frontmatter.slug}.md): ${d.frontmatter.description}`,
    )
    .join('\n')

  return `# moonai

> A Sui-native, policy-aware AI treasury assistant. The AI advises; deterministic code enforces the fund controls. MoonAi does real on-chain work on Sui (balances, transfers, swaps, lending, yield discovery) from the terminal, Telegram, or a web console. Every value-moving action runs through a four-gate pipeline: policy (the on-chain moonai::policy Move package plus pure, unit-tested caps and allowlists) -> simulate (PTB dry-run before gas) -> approval (material-risk actions prompt a human even under YOLO) -> execute (broadcast the PTB + Walrus receipt).

## Install

bun is REQUIRED. MoonAi is a Bun + Biome monorepo and the CLI runs on Bun.

\`\`\`
bun install
export OPENAI_API_KEY=sk-...
bun run moonai init
bun run moonai chat
\`\`\`

The brain is any OpenAI-compatible model (default \`gpt-4o-mini\`), swappable via \`MOONAI_LLM_BASE_URL\` and \`MOONAI_LLM_MODEL\`. The identity is a Sui address derived from a local Ed25519 keypair; there is no on-chain mint to start.

## For AI agents

The fund-control policy lives in \`MOONAI_POLICY_*\` environment variables (caps, allowlists, slippage, autonomy tier, read-only) and the on-chain moonai::policy Move package, not in the prompt. The model cannot raise a limit, skip a simulation, or grant its own approval; those decisions are deterministic code. Use the Sui testnet for exploratory work, then Sui mainnet. Full install model, anti-patterns, and the safety model: ${SITE_ORIGIN}/docs/agents.md

- Full single-file dump: ${SITE_ORIGIN}/llms-full.txt
- Per-page raw markdown: ${SITE_ORIGIN}/docs/<slug>.md (e.g. ${SITE_ORIGIN}/docs/quickstart.md)

## Docs

${docBullets}

## Reference

- README: https://github.com/rifkyeasy/moonai#readme
- Console: ${SITE_ORIGIN}/console
- Releases: https://github.com/rifkyeasy/moonai/releases
- Networks: Sui mainnet (https://fullnode.mainnet.sui.io:443, https://suiscan.xyz), Sui testnet (https://fullnode.testnet.sui.io:443, https://suiscan.xyz/testnet)
- Gas token: SUI (9 decimals; smallest unit is MIST, 1 SUI = 1e9 MIST)
- Integrations: DeepBook (native order book), Cetus / Turbos (swaps), NAVI / Suilend / Scallop (lending), Walrus (memory + receipts), DeFiLlama (yield discovery, read-only)
`
}

async function renderLlmsFull(): Promise<string> {
  const [docs, readme] = await Promise.all([listDocs(), readReadme()])
  const docBySlug = new Map(docs.map(d => [d.frontmatter.slug, d]))

  const header = `# moonai — full machine-readable docs

> A Sui-native, policy-aware AI treasury assistant. The AI advises; deterministic code enforces the fund controls. This file inlines every documentation page plus the repo README. Sections separated by horizontal rules. Each doc body is preceded by a source pointer when frontmatter declares one.

> Setup: MoonAi is a Bun + Biome monorepo. Run \`bun install\`, set \`OPENAI_API_KEY\` (the brain is any OpenAI-compatible model, default \`gpt-4o-mini\`), then \`bun run moonai init\` and \`bun run moonai chat\`. The identity is a Sui address from a local Ed25519 keypair; no on-chain mint is required to start.

> Safety model: every value-moving action runs through policy (pure, unit-tested) -> simulate (dry-run) -> approval (material-risk prompts a human even under YOLO) -> execute (broadcast + receipt). The fund-control policy lives in \`MOONAI_POLICY_*\` environment variables, not in the prompt; the model cannot override it.

Binary name: \`moonai\` (run via \`bun run moonai\`). Engine: Bun.`

  const sections: string[] = [header]

  sections.push(`## README\n\n${sourceBlock('README.md')}${readme.trim()}`)

  const seen = new Set<string>()
  for (const slug of FULL_ORDER) {
    const d = docBySlug.get(slug)
    if (!d) continue
    sections.push(renderDocSection(d))
    seen.add(slug)
  }
  for (const d of docs) {
    if (seen.has(d.frontmatter.slug)) continue
    sections.push(renderDocSection(d))
  }

  return `${sections.join('\n\n---\n\n')}\n`
}

function sourceBlock(source: string | undefined): string {
  return source ? `> Source: ${REPO_BASE}${source}\n\n` : ''
}

function renderDocSection(d: Doc): string {
  return `## ${d.frontmatter.title}\n\n${sourceBlock(d.frontmatter.source)}${d.content.trim()}`
}

async function renderDocRaw(slug: string): Promise<string | null> {
  const doc = await getDoc(slug)
  if (!doc) return null
  return `${sourceBlock(doc.frontmatter.source)}${doc.content.trim()}`
}

async function readReadme(): Promise<string> {
  const readmePath = path.join(process.cwd(), '..', '..', 'README.md')
  try {
    return await fs.readFile(readmePath, 'utf8')
  } catch {
    return '# moonai\n\nREADME not bundled in this build. Read it at https://github.com/rifkyeasy/moonai#readme'
  }
}
