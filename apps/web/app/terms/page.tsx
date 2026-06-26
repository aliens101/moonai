import { LegalSection, LegalShell } from '@/components/legal/LegalShell'

export const metadata = {
  title: 'Terms of Use · moonai',
  description: 'The terms that govern your use of moonai — a non-custodial, policy-aware AI treasury assistant on Sui.',
}

export default function TermsPage() {
  return (
    <LegalShell
      label="terms"
      title="Terms of Use"
      updated="June 15, 2026"
      intro="These terms govern your use of the moonai console, CLI, SDK, and related services (the “Service”). By using the Service you agree to them."
    >
      <LegalSection heading="1. The Service is non-custodial">
        <p>
          moonai helps you analyse and execute on-chain actions on Sui. It never takes custody of
          your funds or private keys. You connect a wallet (or derive an agent wallet that you
          control) and you sign transactions yourself. We cannot move, freeze, or recover your assets.
        </p>
      </LegalSection>

      <LegalSection heading="2. Not financial advice">
        <p>
          The Service, including any AI-generated analysis, yields, or suggestions, is provided for
          informational purposes only and is not financial, investment, legal, or tax advice. You are
          solely responsible for your decisions and transactions. Digital assets are volatile and you
          can lose funds.
        </p>
      </LegalSection>

      <LegalSection heading="3. Your responsibilities">
        <p>
          You are responsible for the security of your wallet and keys, for reviewing every action
          before you sign it, for setting appropriate policy limits, and for complying with the laws
          that apply to you. You must not use the Service if doing so is unlawful in your
          jurisdiction.
        </p>
      </LegalSection>

      <LegalSection heading="4. Acceptable use">
        <p>
          You agree not to use the Service for unlawful activity, to attempt to bypass its policy or
          safety controls, to disrupt or attack the infrastructure, or to harm others. See our{' '}
          <a className="underline" href="/policies">
            Other Policies
          </a>{' '}
          for details.
        </p>
      </LegalSection>

      <LegalSection heading="5. Third-party services">
        <p>
          The Service interacts with third-party protocols, networks, and providers (for example
          Sui, DEX aggregators, lending markets, and LLM providers). We do not control them and are
          not responsible for their availability, security, or outcomes.
        </p>
      </LegalSection>

      <LegalSection heading="6. No warranty">
        <p>
          The Service is provided “as is” and “as available,” without warranties of any kind, express
          or implied. We do not warrant that it will be uninterrupted, error-free, or that
          simulations and analyses will be accurate.
        </p>
      </LegalSection>

      <LegalSection heading="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, moonai and its contributors are not liable for any
          indirect, incidental, or consequential damages, or for any loss of funds, profits, or data
          arising from your use of the Service.
        </p>
      </LegalSection>

      <LegalSection heading="8. Changes">
        <p>
          We may update these terms as the Service evolves. Continued use after an update means you
          accept the revised terms.
        </p>
      </LegalSection>
    </LegalShell>
  )
}
