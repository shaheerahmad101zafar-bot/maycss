import type { Metadata } from "next";
import Link from "next/link";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { withCanonical } from "@/lib/seo/canonical";

export const metadata: Metadata = withCanonical(
  {
    title: "Terms of Service | MAYCSS",
    description:
      "MAYCSS Terms of Service for myacssstore.store — purchases, returns, and customer responsibilities. Contact myacssstore@gmail.com.",
    keywords: ["MAYCSS", "terms of service", "legal"],
  },
  "/terms-of-service",
);

/**
 * Static Terms of Service for Google Merchant Center trust / misrepresentation checks.
 */
export default function TermsOfServicePage() {
  const email = MAYCSS_BUSINESS.supportEmail;
  const phone = MAYCSS_BUSINESS.supportPhone;
  const address = MAYCSS_BUSINESS.addressSingleLine;
  const days = MAYCSS_BUSINESS.returnWindowDays;

  return (
    <article className="mc-page">
      <header className="mc-page__header">
        <div className="mc-container mc-page__header-inner">
          <p className="mc-page__eyebrow">Legal</p>
          <h1 className="mc-page__title">Terms of Service</h1>
          <p className="mc-page__hero">
            Please read these Terms of Service carefully before purchasing from
            MAYCSS.
          </p>
        </div>
      </header>

      <div className="mc-container mc-page__body">
        <div className="mc-page__blocks" style={{ maxWidth: 720 }}>
          <section className="mc-block mc-block--richtext">
            <h2>Agreement to terms</h2>
            <p>
              By accessing <strong>myacssstore.store</strong> or placing an
              order with <strong>MAYCSS</strong>, you agree to these Terms of
              Service. Store name: MAYCSS. Business address: {address}. Support:{" "}
              <a href={`mailto:${email}`}>{email}</a> ·{" "}
              <a href={`tel:${MAYCSS_BUSINESS.supportPhoneTel}`}>{phone}</a>.
            </p>
            <p>Last updated: July 30, 2026.</p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Eligibility</h2>
            <p>
              You must be able to form a legally binding contract to place an
              order. By checking out, you confirm that the information you
              provide is accurate and that you are authorized to use the payment
              method selected.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Orders &amp; pricing</h2>
            <p>
              All prices are listed in USD unless otherwise stated. We reserve
              the right to refuse or cancel orders in case of pricing errors,
              suspected fraud, payment failure, or stock issues. You will receive
              an order confirmation by email after checkout.
            </p>
            <p>
              Product images and descriptions are provided for information;
              slight variations in color or appearance can occur due to display
              settings and manufacturing.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Shipping</h2>
            <p>
              Shipping methods, processing times, and delivery estimates are
              described in our{" "}
              <Link href="/shipping-policy">Shipping Policy</Link>. Risk of loss
              passes to you upon delivery to the carrier, except where required
              otherwise by applicable law.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Returns &amp; refunds</h2>
            <p>
              Returns are governed by our{" "}
              <Link href="/refund-policy">Refund &amp; Return Policy</Link>: a{" "}
              {days}-day return window from delivery and mail-in returns to
              MAYCSS at {address}. Contact{" "}
              <a href={`mailto:${email}`}>{email}</a> to start a return.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Intellectual property</h2>
            <p>
              All content on this website — including text, graphics, logos, and
              product imagery — is owned by MAYCSS or its licensors and may not
              be copied or reused without permission, except for personal,
              non-commercial browsing and shopping.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Acceptable use</h2>
            <p>
              You agree not to misuse the site, attempt unauthorized access,
              interfere with security features, or use the store for unlawful
              activity. We may suspend accounts that violate these terms.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Limitation of liability</h2>
            <p>
              To the fullest extent permitted by law, MAYCSS is not liable for
              indirect, incidental, or consequential damages arising from your
              use of the site or products purchased. Our total liability for any
              claim related to an order is limited to the amount you paid for
              that order.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Privacy</h2>
            <p>
              How we handle personal data is explained in our{" "}
              <Link href="/privacy-policy">Privacy Policy</Link>.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Governing law</h2>
            <p>
              These terms are governed by the laws of the State of Missouri,
              United States, without regard to conflict-of-law principles,
              except where mandatory consumer protections in your jurisdiction
              apply.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Changes to these terms</h2>
            <p>
              We may update these Terms of Service from time to time. The
              current version will always be posted on this page. Continued use
              of the site after changes constitutes acceptance of the updated
              terms.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Contact</h2>
            <p>
              Questions about these terms: visit{" "}
              <Link href="/contact">Contact Us</Link>, email{" "}
              <a href={`mailto:${email}`}>{email}</a>, call {phone}, or write to
              MAYCSS, {address}.
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
