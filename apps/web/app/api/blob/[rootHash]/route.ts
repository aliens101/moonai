// CORS proxy for the Walrus aggregator. Client-side fetchBlobById falls back to
// /api/blob/<blobId> when the aggregator rejects cross-origin reads.
// Content-addressed: a Walrus blob id is a stable identifier, so we cache hard.

import type { NextRequest } from 'next/server'

const AGGREGATOR_URL = 'https://aggregator.walrus-mainnet.walrus.space'

// Walrus blob ids are URL-safe base64 (no padding), ~43 chars. Be permissive
// but reject anything with path separators or that's implausibly long/short.
const BLOB_ID_RE = /^[A-Za-z0-9_-]{20,80}$/

export const runtime = 'nodejs'

export async function GET(_req: NextRequest, context: { params: Promise<{ rootHash: string }> }) {
  // The dynamic segment is named [rootHash] for route-path stability; it now
  // carries a Walrus blob id.
  const { rootHash: blobId } = await context.params
  if (!BLOB_ID_RE.test(blobId)) {
    return new Response('invalid blob id', { status: 400 })
  }
  try {
    const bytes = await fetchBlobFromAggregator(blobId)
    return new Response(bytes as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'public, max-age=3600, immutable',
        'X-MoonAi-Source': 'walrus',
      },
    })
  } catch (err) {
    return new Response((err as Error).message || 'blob fetch failed', { status: 502 })
  }
}

async function fetchBlobFromAggregator(blobId: string): Promise<Uint8Array> {
  const resp = await fetch(`${AGGREGATOR_URL}/v1/blobs/${encodeURIComponent(blobId)}`, {
    signal: AbortSignal.timeout(15_000),
  })
  if (!resp.ok) throw new Error(`aggregator ${resp.status}`)
  const buf = await resp.arrayBuffer()
  return new Uint8Array(buf)
}
