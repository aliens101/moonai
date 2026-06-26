'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type ReactNode, useState } from 'react'

// Moon AI runs on Casper — wallet/auth is via casper-js-sdk / CSPR.click, not the
// Sui dapp-kit providers the imported shell shipped with. Kept minimal (just
// react-query) until the Casper wallet context lands.
export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
