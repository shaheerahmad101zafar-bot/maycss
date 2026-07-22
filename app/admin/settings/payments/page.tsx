import PaymentSettingsForm from "@/components/admin/PaymentSettingsForm";
import PaymentLinkCreator from "@/components/admin/PaymentLinkCreator";
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
            Save your API key once. Checkout and payment links both charge in{" "}
            <strong>USD</strong>. Customers see “Card payment” — never the
            processor brand name.
          </p>
        </div>
      </header>
      <PaymentSettingsForm initial={settings.payments} strategies={strategies} />
      <PaymentLinkCreator enabled={settings.payments.enabled} />
    </section>
  );
}
