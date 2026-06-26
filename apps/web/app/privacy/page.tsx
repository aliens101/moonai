import { LegalSection, LegalShell } from '@/components/legal/LegalShell'

export const metadata = {
  title: 'Privacy Policy · moonai',
  description: 'What moonai collects, what it never collects, and how your data is handled.',
}

export default function PrivacyPage() {
  return (
    <LegalShell
      label="privacy"
      title="Privacy Policy"
      updated="June 15, 2026"
      intro="This policy explains what data moonai handles when you use the console, CLI, and SDK — and, just as importantly, what it never touches."
    >
      <LegalSection heading="What we never collect">
        <p>
          We never collect or store your private keys, seed phrases, or funds. The Service is
          non-custodial — keys stay in your wallet and signing happens on your device. There is no
          server-side key for the public console.
        </p>
      </LegalSection>

      <LegalSection heading="What we collect">
        <p>
          <strong>Wallet address.</strong> When you sign in, we verify a wallet signature over a
          server-issued nonce to establish a session. We store your public wallet address to scope
          your data to you.
        </p>
        <p>
          <strong>Chat history.</strong> If you use the hosted console, your conversations are stored
          server-side, keyed to your wallet address, so they persist across devices. They are private
          to your session and not shared with other users.
        </p>
        <p>
          <strong>Operational logs.</strong> Standard request and error logs (such as timestamps and
          status codes) used to keep the Service running and secure.
        </p>
      </LegalSection>

      <LegalSection heading="AI processing">
        <p>
          To answer you, the content of your messages and relevant context is sent to a large language
          model provider (for example OpenAI, Anthropic, or OpenRouter — or your own provider if you
          bring your own key). We do not use your conversations to train models. Review your chosen
          provider’s policies for how they handle requests.
        </p>
      </LegalSection>

      <LegalSection heading="On-chain data">
        <p>
          Transactions you execute are recorded on public blockchains by their nature. Anything written
          to Sui (or any chain) is public and permanent, and outside our control.
        </p>
      </LegalSection>

      <LegalSection heading="Cookies & sessions">
        <p>
          We use a session cookie to keep you signed in after wallet-signature verification. We do not use
          third-party advertising or cross-site tracking cookies.
        </p>
      </LegalSection>

      <LegalSection heading="Your choices">
        <p>
          You can disconnect your wallet at any time, and you can clear your chat history from the
          console. Self-hosting the open-source CLI/SDK keeps data entirely on your own machine.
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>We may update this policy as the Service evolves; the “last updated” date reflects the latest version.</p>
      </LegalSection>
    </LegalShell>
  )
}
