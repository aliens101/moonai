// Sui explorer URL helpers (Suiscan + Suivision).
// Replaces the old Sui (suiscan) helpers.

import { DEFAULT_NETWORK, type SuiNetwork } from './chain/chain'

const SUISCAN_BASE = 'https://suiscan.xyz'
const SUIVISION_BASE = 'https://suivision.xyz'

/** Suiscan tx page: https://suiscan.xyz/<network>/tx/<digest> */
export function txUrl(digest: string, network: SuiNetwork = DEFAULT_NETWORK): string {
  return `${SUISCAN_BASE}/${network}/tx/${digest}`
}

/** Suiscan object page: https://suiscan.xyz/<network>/object/<id> */
export function objectUrl(id: string, network: SuiNetwork = DEFAULT_NETWORK): string {
  return `${SUISCAN_BASE}/${network}/object/${id}`
}

/** Suiscan account page: https://suiscan.xyz/<network>/account/<addr> */
export function accountUrl(addr: string, network: SuiNetwork = DEFAULT_NETWORK): string {
  return `${SUISCAN_BASE}/${network}/account/${addr}`
}

/** Suiscan coin/type page. */
export function coinUrl(coinType: string, network: SuiNetwork = DEFAULT_NETWORK): string {
  return `${SUISCAN_BASE}/${network}/coin/${encodeURIComponent(coinType)}`
}

// ─── Suivision variants (alternative explorer) ───────────────────────────────

export function suivisionTxUrl(digest: string, network: SuiNetwork = DEFAULT_NETWORK): string {
  const sub = network === 'mainnet' ? '' : `${network}.`
  return `https://${sub}suivision.xyz/txblock/${digest}`.replace('https://suivision', `${SUIVISION_BASE}`)
}

export function suivisionObjectUrl(id: string, network: SuiNetwork = DEFAULT_NETWORK): string {
  const sub = network === 'mainnet' ? '' : `${network}.`
  return `https://${sub}suivision.xyz/object/${id}`
}

export function truncate(value: string, head = 6, tail = 4): string {
  if (!value) return ''
  if (value.length <= head + tail + 2) return value
  return `${value.slice(0, head)}…${value.slice(-tail)}`
}
