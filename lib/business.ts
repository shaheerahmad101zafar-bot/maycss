/**
 * Official MAYCSS business profile — keep in sync with Google Merchant Center.
 * Used by footer, contact, schema, and policy defaults.
 */
export const MAYCSS_BUSINESS = {
  storeName: "MAYCSS",
  legalName: "MAYCSS",
  addressLine1: "1707 S Lee's Summit Rd",
  city: "Independence",
  state: "MO",
  postalCode: "64050",
  country: "USA",
  countryCode: "US",
  /** Full single-line / multi-line address for display. */
  get addressMultiline() {
    return `${this.addressLine1}\n${this.city}, ${this.state} ${this.postalCode}\n${this.country}`;
  },
  get addressSingleLine() {
    return `${this.addressLine1}, ${this.city}, ${this.state} ${this.postalCode}, ${this.country}`;
  },
  supportEmail: "myacssstore@gmail.com",
  supportPhone: "+1 (501) 436-9308",
  supportPhoneTel: "+15014369308",
  /** GMC-aligned return window (calendar days from delivery). */
  returnWindowDays: 10,
} as const;

/** Human-readable returns blurb matching JSON-LD / refund policy. */
export function productReturnsSummary(): string {
  return `${MAYCSS_BUSINESS.returnWindowDays}-day mail-in returns on eligible unworn items. See our Refund & Return Policy for details.`;
}
