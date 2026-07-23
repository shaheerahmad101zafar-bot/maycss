import type { Metadata } from "next";
import Link from "next/link";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { withCanonical } from "@/lib/seo/canonical";

export const metadata: Metadata = withCanonical(
  {
    title: "Shipping Policy | MAYCSS",
    description:
      "MAYCSS shipping policy — delivery times, costs, and tracking for orders to the United States. Contact myacssstore@gmail.com for shipping help.",
    keywords: ["MAYCSS", "shipping policy", "delivery", "tracking"],
  },
  "/shipping-policy",
);

/**
 * Static shipping policy for Google Merchant Center trust / misrepresentation checks.
 * Kept as a code route so CMS layouts, banners, and product assets stay untouched.
 */
export default function ShippingPolicyPage() {
  const email = MAYCSS_BUSINESS.supportEmail;
  const phone = MAYCSS_BUSINESS.supportPhone;
  const address = MAYCSS_BUSINESS.addressSingleLine;

  return (
    <article className="mc-page">
      <header className="mc-page__header">
        <div className="mc-container mc-page__header-inner">
          <p className="mc-page__eyebrow">Customer care</p>
          <h1 className="mc-page__title">Shipping Policy</h1>
          <p className="mc-page__hero">
            How MAYCSS ships your order — processing times, delivery estimates,
            and how to reach us about a shipment.
          </p>
        </div>
      </header>

      <div className="mc-container mc-page__body">
        <div className="mc-page__blocks" style={{ maxWidth: 720 }}>
          <section className="mc-block mc-block--richtext">
            <h2>Who we are</h2>
            <p>
              <strong>MAYCSS</strong> ships online orders from the United States.
              Business address: {address}. Support:{" "}
              <a href={`mailto:${email}`}>{email}</a> ·{" "}
              <a href={`tel:${MAYCSS_BUSINESS.supportPhoneTel}`}>{phone}</a>.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Processing time</h2>
            <p>
              Orders are typically processed within 1–3 business days after
              payment confirmation (excluding weekends and US public holidays).
              You will receive an email when your order ships.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Delivery estimates</h2>
            <p>
              Standard US delivery usually arrives within 3–7 business days after
              shipment, depending on your location and carrier. Transit times are
              estimates and may vary during peak seasons or weather delays.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Shipping costs</h2>
            <p>
              Shipping cost (if any) is calculated at checkout before you pay.
              Free-shipping promotions, when offered, are shown clearly on the
              cart and checkout pages.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Tracking</h2>
            <p>
              When a tracking number is available, we email it to the address used
              at checkout. For help with a shipment, visit{" "}
              <Link href="/contact">Contact Us</Link> with your order ID.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Returns &amp; undeliverable packages</h2>
            <p>
              Eligible returns follow our{" "}
              <Link href="/refund-policy">Refund &amp; Returns Policy</Link>{" "}
              (10-day window, mail-in to {address}). If a package is returned as
              undeliverable, contact{" "}
              <a href={`mailto:${email}`}>{email}</a> so we can help reship or
              refund according to that policy.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Contact us about shipping</h2>
            <p>
              Questions about an order in transit? Visit{" "}
              <Link href="/contact">Contact Us</Link> or email {email} / call{" "}
              {phone}.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
