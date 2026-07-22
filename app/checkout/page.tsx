import { Suspense } from "react";
import CheckoutView from "@/components/checkout/CheckoutView";
import { PaymentEngine } from "@/lib/payments/engine";
import { getEnabledManualMethods, getSettings } from "@/lib/settings";

export const metadata = {
  title: "Checkout · MayCSS",
  description: "Complete your MayCSS order.",
};

export default async function CheckoutPage() {
  const [manualMethods, settings, gatewayName] = await Promise.all([
    getEnabledManualMethods(),
    getSettings(),
    PaymentEngine.gatewayName().catch(() => "Card payment"),
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
        gatewayName={
          settings.payments.enabled
            ? settings.payments.merchantName || gatewayName
            : gatewayName
        }
      />
    </Suspense>
  );
}
