import PaymentSettingsForm from "@/components/admin/PaymentSettingsForm";
import { getSettings } from "@/lib/settings";
import { PaymentProviderRegistry } from "@/lib/payments/registry";

export const metadata = { title: "Payment Settings · Admin · MayCSS" };

export default async function AdminPaymentSettingsPage() {
  const settings = await getSettings();
  const strategies = PaymentProviderRegistry.listPublic();

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Payment Providers</h1>
          <p>
            Pick a gateway from the registry. Each provider declares its own
            credential form — Ziina asks for just an API key, Stripe asks for
            key + secret. No code changes to switch. Register additional
            strategies in <code>lib/payments/registry.ts</code>.
          </p>
        </div>
      </header>
      <PaymentSettingsForm initial={settings.payments} strategies={strategies} />
    </section>
  );
}
