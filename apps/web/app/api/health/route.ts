import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type ServiceStatus = 'operational' | 'degraded' | 'down'
type Service = { id: string; name: string; status: ServiceStatus; detail: string }

const SUI_MAINNET_RPC = 'https://fullnode.mainnet.sui.io:443'
const WALRUS_AGGREGATOR = 'https://aggregator.walrus-mainnet.walrus.space'

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms)
    p.then(
      v => {
        clearTimeout(t)
        resolve(v)
      },
      e => {
        clearTimeout(t)
        reject(e)
      },
    )
  })
}

// Live Sui RPC ping — proves the fullnode answers, and how fast. Reads the
// latest checkpoint sequence number via JSON-RPC (no SDK dependency).
async function pingSui(id: string, name: string, rpcUrl: string): Promise<Service> {
  const started = Date.now()
  try {
    const resp = await withTimeout(
      fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'sui_getLatestCheckpointSequenceNumber',
          params: [],
        }),
      }),
      4000,
    )
    if (!resp.ok) throw new Error(`rpc ${resp.status}`)
    const j = (await resp.json()) as { result?: string; error?: unknown }
    if (j.error || j.result == null) throw new Error('rpc error')
    const ms = Date.now() - started
    return {
      id,
      name,
      status: ms > 2500 ? 'degraded' : 'operational',
      detail: `checkpoint ${j.result} · ${ms}ms`,
    }
  } catch {
    return { id, name, status: 'down', detail: 'RPC unreachable' }
  }
}

// Walrus aggregator reachability — proves the receipt/memory storage path is up.
async function pingWalrus(id: string, name: string, aggregatorUrl: string): Promise<Service> {
  const started = Date.now()
  try {
    // The aggregator root responds even without a blob id; any answer proves
    // the endpoint is live.
    const resp = await withTimeout(fetch(aggregatorUrl, { method: 'GET' }), 4000)
    const ms = Date.now() - started
    return {
      id,
      name,
      status: resp.status >= 500 ? 'degraded' : ms > 2500 ? 'degraded' : 'operational',
      detail: `reachable · ${ms}ms`,
    }
  } catch {
    return { id, name, status: 'down', detail: 'aggregator unreachable' }
  }
}

export async function GET() {
  const [sui, walrus] = await Promise.all([
    pingSui('sui', 'Sui network', SUI_MAINNET_RPC),
    pingWalrus('walrus', 'Walrus storage', WALRUS_AGGREGATOR),
  ])

  const services: Service[] = [
    { id: 'web', name: 'Web console', status: 'operational', detail: 'moonaiai.space' },
    { id: 'api', name: 'Chat & agent API', status: 'operational', detail: 'responding' },
    sui,
    walrus,
  ]

  const overall: ServiceStatus = services.some(s => s.status === 'down')
    ? 'degraded'
    : services.some(s => s.status === 'degraded')
      ? 'degraded'
      : 'operational'

  return NextResponse.json(
    { status: overall, checkedAt: new Date().toISOString(), services },
    { headers: { 'cache-control': 'no-store' } },
  )
}
