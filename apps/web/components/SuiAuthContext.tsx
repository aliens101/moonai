'use client'

import { createContext, useContext, type ReactNode } from 'react'
import { useSuiAuth as useSuiAuthHook, type SuiAuth } from '@/lib/use-sui-auth'

const SuiAuthContext = createContext<SuiAuth | null>(null)

export function SuiAuthProvider({ children }: { children: ReactNode }) {
  const auth = useSuiAuthHook()
  return <SuiAuthContext.Provider value={auth}>{children}</SuiAuthContext.Provider>
}

/**
 * Access the Sui auth session.
 *
 * Returns `{ address, isAuthed, signIn, signOut, isPending }` (plus `status` and
 * `error` for richer UI states).
 */
export function useSuiAuth(): SuiAuth {
  const ctx = useContext(SuiAuthContext)
  if (!ctx) throw new Error('useSuiAuth requires SuiAuthProvider')
  return ctx
}
