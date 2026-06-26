// Walrus browser client. Read-only.
// Fetches a blob from Walrus by its blob id via a public aggregator's HTTP API
// (GET <aggregator>/v1/blobs/<blobId>). Pure fetch, no SDK. Lazy CORS detection
// with fallback to the local /api/blob/<blobId> proxy route.

export const AGGREGATOR_URL_MAINNET = 'https://aggregator.walrus-mainnet.walrus.space'
export const AGGREGATOR_URL_TESTNET = 'https://aggregator.walrus-testnet.walrus.space'

let useProxyMode: boolean | null = null // null = untested, false = direct, true = proxy

function shouldForceProxy(): boolean {
  if (typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_BLOB_PROXY === '1') return true
  return false
}

/**
 * Fetch a blob from Walrus by its blob id.
 *
 * Tries a direct browser → aggregator request first. On CORS/network failure,
 * retries via the local /api/blob/[blobId] proxy route. The result of the first
 * attempt is cached for the session so we don't retry the same path repeatedly.
 */
export async function fetchBlobById(
  blobId: string,
  opts: { aggregatorUrl?: string; network?: 'mainnet' | 'testnet' } = {},
): Promise<Uint8Array> {
  const aggregatorUrl =
    opts.aggregatorUrl ||
    (opts.network === 'testnet' ? AGGREGATOR_URL_TESTNET : AGGREGATOR_URL_MAINNET)

  if (shouldForceProxy()) {
    useProxyMode = true
  }

  if (useProxyMode === null) {
    try {
      const direct = await fetchBlobDirect(aggregatorUrl, blobId)
      useProxyMode = false
      return direct
    } catch {
      // Some aggregator deployments don't set Access-Control-Allow-Origin, so
      // cross-origin browser reads are blocked on prod origins. The /api/blob
      // proxy runs server-side (no CORS). Fall back and cache the decision.
      useProxyMode = true
    }
  }
  if (useProxyMode) {
    return fetchBlobViaProxy(blobId)
  }
  try {
    return await fetchBlobDirect(aggregatorUrl, blobId)
  } catch {
    return fetchBlobViaProxy(blobId)
  }
}

async function fetchBlobViaProxy(blobId: string): Promise<Uint8Array> {
  const resp = await fetch(`/api/blob/${encodeURIComponent(blobId)}`)
  if (!resp.ok) {
    throw new Error(`proxy fetch failed: ${resp.status} ${resp.statusText}`)
  }
  const buf = await resp.arrayBuffer()
  return new Uint8Array(buf)
}

async function fetchBlobDirect(aggregatorUrl: string, blobId: string): Promise<Uint8Array> {
  const resp = await fetch(`${aggregatorUrl}/v1/blobs/${encodeURIComponent(blobId)}`)
  if (!resp.ok) throw new Error(`aggregator ${resp.status}`)
  const buf = await resp.arrayBuffer()
  return new Uint8Array(buf)
}
