import { Suspense } from "react";
import type { Metadata } from "next";
import CheckoutView from "@/components/checkout/CheckoutView";
import { customerPaymentLabel } from "@/lib/payments/branding";
import { getEnabledManualMethods, getSettings } from "@/lib/settings";
import { withCanonical } from "@/lib/seo/canonical";

export const metadata: Metadata = withCanonical(
  {
    title: "Checkout · MayCSS",
    description: "Complete your MayCSS order.",
  },
  "/checkout",
  { noindex: true },
);

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
