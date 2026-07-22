/**
 * Customer-facing payment labels — never expose gateway brands
 * (Ziina / ZainPay / Stripe / PayPal) on the storefront.
 */

const GATEWAY_BRAND =
  /\b(ziina|zainpay|zain\s*pay|stripe|paypal|paystack|flutterwave)\b/i;

/** Safe label for checkout UI. */
export function customerPaymentLabel(raw?: string | null): string {
  const s = (raw ?? "").trim();
  if (!s || GATEWAY_BRAND.test(s)) return "Card payment";
  return s;
}

/** Hosted payment page message — brand the store, not the processor. */
export function hostedPaymentMessage(orderId: string, storeName = "MAYCSS"): string {
  return `${storeName} order ${orderId}`;
}
