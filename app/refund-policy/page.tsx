import type { Metadata } from "next";
import Link from "next/link";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { withCanonical } from "@/lib/seo/canonical";

export const metadata: Metadata = withCanonical(
  {
    title: "Refund & Return Policy | MAYCSS",
    description:
      "MAYCSS 10-day refund and return policy — mail-in returns to Independence, MO. Contact myacssstore@gmail.com or +1 (501) 436-9308.",
    keywords: ["MAYCSS", "refund policy", "returns", "10-day returns"],
  },
  "/refund-policy",
);

/**
 * Static refund / returns policy for Google Merchant Center trust checks.
 */
export default function RefundPolicyPage() {
  const email = MAYCSS_BUSINESS.supportEmail;
  const phone = MAYCSS_BUSINESS.supportPhone;
  const days = MAYCSS_BUSINESS.returnWindowDays;
  const address = MAYCSS_BUSINESS.addressSingleLine;

  return (
    <article className="mc-page">
      <header className="mc-page__header">
        <div className="mc-container mc-page__header-inner">
          <p className="mc-page__eyebrow">Customer care</p>
          <h1 className="mc-page__title">Refund &amp; Return Policy</h1>
          <p className="mc-page__hero">
            A clear {days}-day return window with mail-in returns to our
            Independence, MO business address.
          </p>
        </div>
      </header>

      <div className="mc-container mc-page__body">
        <div className="mc-page__blocks" style={{ maxWidth: 720 }}>
          <section className="mc-block mc-block--richtext">
            <h2>Who we are</h2>
            <p>
              This Refund &amp; Return Policy applies to all purchases from{" "}
              <strong>MAYCSS</strong> (myacssstore.store). Store name: MAYCSS.
              Support: <a href={`mailto:${email}`}>{email}</a> ·{" "}
              <a href={`tel:${MAYCSS_BUSINESS.supportPhoneTel}`}>{phone}</a>.
              Returns address: {address}.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>{days}-day return window</h2>
            <p>
              You have <strong>{days} days from the date your order is
              delivered</strong> to start a return. Items must be unworn,
              unwashed, unused, and returned with all original tags and packaging
              intact.
            </p>
            <p>
              Sale / final-sale items are not returnable unless the item is
              faulty or not as described.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>How to return (mail-in)</h2>
            <ol>
              <li>
                Email <a href={`mailto:${email}`}>{email}</a> (or call{" "}
                <a href={`tel:${MAYCSS_BUSINESS.supportPhoneTel}`}>{phone}</a>)
                with your order number and reason for return within {days} days
                of delivery.
              </li>
              <li>
                We will confirm eligibility and provide return instructions.
              </li>
              <li>
                Pack the item securely and mail it to:
                <br />
                <br />
                <strong>MAYCSS Returns</strong>
                <br />
                {MAYCSS_BUSINESS.addressLine1}
                <br />
                {MAYCSS_BUSINESS.city}, {MAYCSS_BUSINESS.state}{" "}
                {MAYCSS_BUSINESS.postalCode}
                <br />
                {MAYCSS_BUSINESS.country}
              </li>
            </ol>
            <p>
              Keep your shipping receipt until your refund is issued. Return
              shipping is the customer&apos;s responsibility unless the item is
              faulty or we sent the wrong item.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>How refunds are issued</h2>
            <p>
              Once we receive and inspect your return, approved refunds are
              issued to your original payment method within 5–10 business days.
              Shipping charges are non-refundable unless the item was faulty or
              we made an error.
            </p>
            <p>
              <strong>Exchanges:</strong> start a return, then place a new order
              for the size or color you want.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Damaged or incorrect items</h2>
            <p>
              If an item arrives damaged or is not what you ordered, email{" "}
              <a href={`mailto:${email}`}>{email}</a> within 7 days of delivery
              with your order number and a clear photo. We will arrange a
              replacement or refund when the issue is confirmed.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Shipping &amp; undeliverable packages</h2>
            <p>
              Delivery timelines are described in our{" "}
              <Link href="/shipping-policy">Shipping Policy</Link>. If a package
              is returned to us as undeliverable, contact{" "}
              <a href={`mailto:${email}`}>{email}</a> so we can help reship or
              refund according to this policy.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Contact us about a return</h2>
            <p>
              Questions? Visit <Link href="/contact">Contact Us</Link>, email{" "}
              <a href={`mailto:${email}`}>{email}</a>, or call {phone}.
            </p>
            <p>
              Related policies:{" "}
              <Link href="/shipping-policy">Shipping Policy</Link> ·{" "}
              <Link href="/terms-of-service">Terms of Service</Link> ·{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
