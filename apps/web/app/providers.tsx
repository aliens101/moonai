'use client'

import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, type ReactNode } from 'react'
import { DEFAULT_SUI_NETWORK, SUI_NETWORKS } from '@/lib/dapp-kit'
import { AgentWalletProvider } from '@/components/AgentWalletContext'
import { SuiAuthProvider } from '@/components/SuiAuthContext'

import '@mysten/dapp-kit/dist/index.css'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <SuiClientProvider networks={SUI_NETWORKS} defaultNetwork={DEFAULT_SUI_NETWORK}>
        <WalletProvider autoConnect>
          <SuiAuthProvider>
            <AgentWalletProvider>{children}</AgentWalletProvider>
          </SuiAuthProvider>
        </WalletProvider>
      </SuiClientProvider>
    </QueryClientProvider>
  )
}
