import { Suspense } from "react";
import CheckoutView from "@/components/checkout/CheckoutView";
import { customerPaymentLabel } from "@/lib/payments/branding";
import { getEnabledManualMethods, getSettings } from "@/lib/settings";

export const metadata = {
  title: "Checkout · MayCSS",
  description: "Complete your MayCSS order.",
};

export default async function CheckoutPage() {
  const [manualMethods, settings] = await Promise.all([
    getEnabledManualMethods(),
    getSettings(),
  ]);

  return (
    <Suspense fallback={<div className="mc-container mc-checkout">Loading checkout…</div>}>
      <CheckoutView
        manualMethods={manualMethods.map((m) => ({
          id: m.id,
          name: m.name,
          qrCode: m.qrCode,
          discountPercent: m.discountPercent,
          instructions: m.instructions,
        }))}
        cardEnabled={settings.payments.enabled}
        gatewayName={customerPaymentLabel(settings.payments.merchantName)}
      />
    </Suspense>
  );
}
