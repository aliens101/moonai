// Display formatting helpers for the Sui console.
// Pure Sui — no chain SDK here — plain strings + bigint.

/** Shorten a Sui address (0x…64 hex) for display: 0x1234…cdef. */
export function shortAddress(a: string, head = 6, tail = 4): string {
  if (!a) return ''
  if (a.length <= head + tail + 2) return a
  return `${a.slice(0, head)}…${a.slice(-tail)}`
}

/** Shorten a tx digest / object id for display. */
export function shortHash(h: string, head = 8, tail = 6): string {
  if (!h) return ''
  if (h.length <= head + tail + 2) return h
  return `${h.slice(0, head)}…${h.slice(-tail)}`
}

export function formatBigInt(n: bigint): string {
  return new Intl.NumberFormat('en-US').format(n)
}

export function formatRelativeTime(secondsAgo: number): string {
  if (secondsAgo < 0) return 'just now'
  if (secondsAgo < 60) return `${secondsAgo}s ago`
  if (secondsAgo < 3600) return `${Math.floor(secondsAgo / 60)}m ago`
  if (secondsAgo < 86400) return `${Math.floor(secondsAgo / 3600)}h ago`
  return `${Math.floor(secondsAgo / 86400)}d ago`
}

/** MIST per SUI. 1 SUI = 1e9 MIST. */
export const MIST_PER_SUI = 1_000_000_000n

/**
 * Format a MIST amount as SUI. `decimals` caps fractional digits (trailing
 * zeros trimmed). Accepts bigint or a numeric string (raw MIST).
 */
export function formatSui(mist: bigint | string | number, decimals = 4): string {
  let m: bigint
  try {
    m = typeof mist === 'bigint' ? mist : BigInt(typeof mist === 'number' ? Math.trunc(mist) : mist)
  } catch {
    return '0'
  }
  const negative = m < 0n
  const w = negative ? -m : m
  const whole = w / MIST_PER_SUI
  const frac = w % MIST_PER_SUI
  const fracStr = frac.toString().padStart(9, '0').slice(0, decimals).replace(/0+$/, '')
  const sign = negative ? '-' : ''
  const wholeStr = new Intl.NumberFormat('en-US').format(whole)
  return fracStr ? `${sign}${wholeStr}.${fracStr}` : `${sign}${wholeStr}`
}

/** Format a MIST amount with the " SUI" suffix. */
export function formatSuiAmount(mist: bigint | string | number, decimals = 4): string {
  return `${formatSui(mist, decimals)} SUI`
}
