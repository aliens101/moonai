import { Footer } from '@/components/Footer'
import { Navbar } from '@/components/Navbar'
import { PolicyPlayground } from '@/components/PolicyPlayground'

export const metadata = {
  title: 'Policy playground · moonai',
  description:
    'Interactively explore MoonAi’s deterministic fund-control policy: configure caps, allowlists, and autonomy, propose an action, and see the verdict computed by the same pure function that guards the agent on-chain.',
}

export default function PlaygroundPage() {
  return (
    <main className="relative min-h-screen bg-[var(--color-cream)] text-[var(--color-ink)]">
      <Navbar />
      <PolicyPlayground />
      <Footer />
    </main>
  )
}
