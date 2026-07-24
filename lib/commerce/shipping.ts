/** Shared storefront shipping rules — keep checkout, cart, and schema in sync. */
export const STORE_SHIPPING = {
  currency: "USD",
  /** Free shipping when subtotal reaches this USD amount. */
  freeThresholdUsd: 75,
  /** Standard US shipping rate when below the free threshold. */
  standardRateUsd: 8.95,
  handlingDaysMin: 1,
  handlingDaysMax: 3,
  transitDaysMin: 3,
  transitDaysMax: 7,
  destinationCountry: "US",
} as const;

/** Human-readable shipping blurb matching JSON-LD / checkout. */
export function productShippingSummary(): string {
  return `Standard US shipping $${STORE_SHIPPING.standardRateUsd.toFixed(2)} USD. Free shipping on orders $${STORE_SHIPPING.freeThresholdUsd}+. Typically ships in ${STORE_SHIPPING.handlingDaysMin}–${STORE_SHIPPING.handlingDaysMax} business days; delivery ${STORE_SHIPPING.transitDaysMin}–${STORE_SHIPPING.transitDaysMax} business days after shipment.`;
}
