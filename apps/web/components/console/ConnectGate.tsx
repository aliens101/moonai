'use client'

import { useSuiAuth } from '@/components/SuiAuthContext'
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit'

const PILL_DARK =
  'rounded-full bg-[var(--color-ink)] px-7 py-3.5 text-[15px] font-medium tracking-tight text-[var(--color-cream)] shadow-[0_18px_40px_-22px_rgba(16,15,9,0.7)] transition-transform hover:-translate-y-0.5 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-wait disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:scale-100'

export function ConnectGate() {
  const account = useCurrentAccount()
  const { isAuthed, signIn, isPending } = useSuiAuth()

  let primary: React.ReactNode
  if (isPending) {
    primary = (
      <button type="button" disabled className={PILL_DARK}>
        Signing…
      </button>
    )
  } else if (account && !isAuthed) {
    // Wallet connected but not signed in — prompt the sign-in step.
    primary = (
      <button type="button" onClick={() => void signIn()} className={PILL_DARK}>
        Sign in <span aria-hidden>→</span>
      </button>
    )
  } else {
    // No wallet connected — show the dApp Kit connect modal trigger.
    primary = <ConnectButton connectText="Connect wallet" />
  }

  return (
    <div className="grid gap-6">
      <div>
        <h2
          className="max-w-[18ch] font-display font-light leading-[1.05] tracking-tight text-[var(--color-ink)]"
          style={{
            fontVariationSettings: '"opsz" 96, "SOFT" 30, "WONK" 0',
            fontSize: 'clamp(34px, 4vw, 56px)',
          }}
        >
          Connect to see your agent.
        </h2>
        <p className="mt-3 max-w-[44ch] text-[15.5px] leading-[1.65] text-[var(--color-ink-2)]">
          Connect your Sui wallet and sign in. The signature proves ownership and creates a session —
          no transaction is sent.
        </p>
      </div>
      <div className="pt-2">{primary}</div>
    </div>
  )
}
