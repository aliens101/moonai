import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Shared OpenAI-compatible LLM proxy for the hackathon demo.
 *
 * Lets anyone run moonai (CLI / gateway) WITHOUT their own OpenAI key:
 *   export MOONAI_LLM_BASE_URL=https://moonaiai.space/api/llm/v1
 *   export OPENAI_API_KEY=<MOONAI_DEMO_LLM_TOKEN>     # the shared demo token, not a real key
 *
 * The proxy holds the real key server-side (OPENAI_API_KEY env) and forwards.
 * Guardrails: shared-token auth, model allowlist, max-tokens cap, per-IP rate limit.
 */

const UPSTREAM = process.env.MOONAI_LLM_UPSTREAM ?? 'https://api.openai.com'
const ALLOWED_MODELS = new Set(['gpt-4o-mini', 'gpt-4.1-mini'])
const FALLBACK_MODEL = 'gpt-4o-mini'
const MAX_TOKENS = 1500
const RATE_PER_MIN = 30

// Best-effort in-memory per-IP limiter (resets on redeploy; fine for a demo).
const hits = new Map<string, { n: number; reset: number }>()
function rateLimited(ip: string, now: number): boolean {
  const e = hits.get(ip)
  if (!e || now > e.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 })
    return false
  }
  e.n += 1
  return e.n > RATE_PER_MIN
}

function authed(req: Request): boolean {
  const expected = process.env.MOONAI_DEMO_LLM_TOKEN
  if (!expected) return false // not configured → closed by default
  const provided = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '').trim()
  return provided.length > 0 && provided === expected
}

export async function POST(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: { message: 'proxy missing upstream key' } }, { status: 503 })
  }
  if (!authed(req)) {
    return NextResponse.json(
      { error: { message: 'Invalid demo token. Set OPENAI_API_KEY to the shared moonai demo token.' } },
      { status: 401 },
    )
  }
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (rateLimited(ip, Date.now())) {
    return NextResponse.json({ error: { message: 'rate limit exceeded (demo)' } }, { status: 429 })
  }

  const path = (await ctx.params).path.join('/') // e.g. v1/chat/completions
  const raw = await req.text()
  let payload = raw
  // Cost control: force a cheap model + cap output tokens on chat/completions.
  if (path.endsWith('chat/completions') && raw) {
    try {
      const body = JSON.parse(raw) as Record<string, unknown>
      const model = typeof body.model === 'string' ? body.model : ''
      if (!ALLOWED_MODELS.has(model)) body.model = FALLBACK_MODEL
      const mt = typeof body.max_tokens === 'number' ? body.max_tokens : undefined
      if (mt == null || mt > MAX_TOKENS) body.max_tokens = MAX_TOKENS
      payload = JSON.stringify(body)
    } catch {
      // leave payload as-is; upstream will validate
    }
  }

  const upstream = await fetch(`${UPSTREAM}/${path}`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: payload,
  })

  // Pass through (supports SSE streaming — body is a ReadableStream).
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      'content-type': upstream.headers.get('content-type') ?? 'application/json',
      'cache-control': 'no-store',
    },
  })
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: { message: 'proxy missing upstream key' } }, { status: 503 })
  }
  if (!authed(req)) {
    return NextResponse.json({ error: { message: 'Invalid demo token.' } }, { status: 401 })
  }
  const path = (await ctx.params).path.join('/')
  const upstream = await fetch(`${UPSTREAM}/${path}`, {
    headers: { authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
  })
  return new Response(upstream.body, {
    status: upstream.status,
    headers: { 'content-type': upstream.headers.get('content-type') ?? 'application/json' },
  })
}
