// Sui dApp Kit network config for the /console flow.
//
// Replaces the old Sui dapp-kit + an Sui Wallet config. We default to mainnet (MoonAi is a
// verified-mainnet product) and keep testnet available for development.

import { getFullnodeUrl } from '@mysten/sui/client'

export const SUI_NETWORKS = {
  mainnet: { url: getFullnodeUrl('mainnet') },
  testnet: { url: getFullnodeUrl('testnet') },
} as const

export type SuiNetwork = keyof typeof SUI_NETWORKS

export const DEFAULT_SUI_NETWORK: SuiNetwork =
  (process.env.NEXT_PUBLIC_SUI_NETWORK as SuiNetwork) || 'mainnet'
