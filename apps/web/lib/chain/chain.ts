// Sui network + MoonAi package configuration for the console.
//
// Replaces the old Sui `defineChain` (Sui) config. MoonAi is a verified-mainnet
// product; testnet stays available for development via NEXT_PUBLIC_SUI_NETWORK.

import { getFullnodeUrl } from '@mysten/sui/client'
import {
  DEFAULT_NETWORK,
  MOONAI_POLICY_PACKAGE_ID,
  SUI_COIN_TYPE,
  type SuiNetwork,
} from './sui'

export { MOONAI_POLICY_PACKAGE_ID, SUI_COIN_TYPE, DEFAULT_NETWORK }
export type { SuiNetwork }

export const SUI_NETWORKS: Record<SuiNetwork, { name: string; url: string; explorer: string }> = {
  mainnet: { name: 'Sui Mainnet', url: getFullnodeUrl('mainnet'), explorer: 'https://suiscan.xyz/mainnet' },
  testnet: { name: 'Sui Testnet', url: getFullnodeUrl('testnet'), explorer: 'https://suiscan.xyz/testnet' },
  devnet: { name: 'Sui Devnet', url: getFullnodeUrl('devnet'), explorer: 'https://suiscan.xyz/devnet' },
  localnet: { name: 'Sui Localnet', url: getFullnodeUrl('localnet'), explorer: 'https://suiscan.xyz/localnet' },
}

export const ACTIVE_NETWORK = SUI_NETWORKS[DEFAULT_NETWORK]
