import type { Metadata } from "next";
import Link from "next/link";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { withCanonical } from "@/lib/seo/canonical";

export const metadata: Metadata = withCanonical(
  {
    title: "Privacy Policy | MAYCSS",
    description:
      "MAYCSS Privacy Policy — how we collect, use, and protect your personal information when you shop at myacssstore.store.",
    keywords: ["MAYCSS", "privacy policy", "data protection"],
  },
  "/privacy-policy",
);

/**
 * Static privacy policy for Google Merchant Center trust / misrepresentation checks.
 */
export default function PrivacyPolicyPage() {
  const email = MAYCSS_BUSINESS.supportEmail;
  const phone = MAYCSS_BUSINESS.supportPhone;
  const address = MAYCSS_BUSINESS.addressSingleLine;

  return (
    <article className="mc-page">
      <header className="mc-page__header">
        <div className="mc-container mc-page__header-inner">
          <p className="mc-page__eyebrow">Legal</p>
          <h1 className="mc-page__title">Privacy Policy</h1>
          <p className="mc-page__hero">
            How MAYCSS collects, uses, and protects your personal information
            when you visit or shop on our website.
          </p>
        </div>
      </header>

      <div className="mc-container mc-page__body">
        <div className="mc-page__blocks" style={{ maxWidth: 720 }}>
          <section className="mc-block mc-block--richtext">
            <h2>Who we are</h2>
            <p>
              This Privacy Policy applies to <strong>MAYCSS</strong>{" "}
              (myacssstore.store). Business address: {address}. Support:{" "}
              <a href={`mailto:${email}`}>{email}</a> ·{" "}
              <a href={`tel:${MAYCSS_BUSINESS.supportPhoneTel}`}>{phone}</a>.
            </p>
            <p>
              Last updated: July 30, 2026. By using our site, you agree to the
              practices described here.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Information we collect</h2>
            <p>We may collect:</p>
            <ul>
              <li>
                <strong>Account &amp; checkout details</strong> — name, email,
                shipping and billing address, phone number, and order history.
              </li>
              <li>
                <strong>Payment information</strong> — processed by our
                PCI-DSS compliant payment providers. We do not store your full
                card number on our servers.
              </li>
              <li>
                <strong>Technical &amp; usage data</strong> — IP address, browser
                type, device information, pages viewed, and cart activity used
                to operate and improve the site.
              </li>
              <li>
                <strong>Communications</strong> — messages you send via our{" "}
                <Link href="/contact">Contact Us</Link> form or email.
              </li>
            </ul>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>How we use your information</h2>
            <p>We use personal information to:</p>
            <ul>
              <li>Process, fulfill, and ship orders</li>
              <li>Send order confirmations, shipping updates, and support replies</li>
              <li>Maintain your account and improve site performance</li>
              <li>
                Send marketing emails only if you opt in (you may unsubscribe
                at any time)
              </li>
              <li>Prevent fraud and enforce our Terms of Service</li>
            </ul>
            <p>
              <strong>We do not sell your personal information</strong> to third
              parties.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Cookies</h2>
            <p>
              We use essential cookies to keep your shopping bag and preferences
              between visits, and analytics cookies to understand how the site
              is used. You can control cookies through your browser settings.
              Disabling some cookies may affect checkout or saved preferences.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Sharing with service providers</h2>
            <p>
              We share data only with trusted service providers who help us
              operate the store — for example payment processors, shipping
              carriers, email delivery, and hosting. They are permitted to use
              your information only to perform services for MAYCSS.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Data security</h2>
            <p>
              Payments are processed over TLS-encrypted connections by PCI-DSS
              compliant providers. We take reasonable administrative and
              technical measures to protect personal data. No method of
              transmission over the Internet is 100% secure; if you suspect
              unauthorized account activity, contact us immediately.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Your rights</h2>
            <p>
              You may request a copy of the personal data we hold, ask us to
              correct inaccurate information, or request deletion of your
              account where applicable. Email{" "}
              <a href={`mailto:${email}`}>{email}</a> and we will respond within
              a reasonable timeframe.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Policy updates</h2>
            <p>
              We may update this Privacy Policy from time to time. The revised
              version will be posted on this page with an updated date.
              Continued use of the site after changes means you accept the
              revised policy.
            </p>
          </section>

          <section className="mc-block mc-block--richtext">
            <h2>Contact us about privacy</h2>
            <p>
              Privacy questions: visit <Link href="/contact">Contact Us</Link>,
              email <a href={`mailto:${email}`}>{email}</a>, call {phone}, or
              write to MAYCSS, {address}.
            </p>
            <p>
              Related policies:{" "}
              <Link href="/terms-of-service">Terms of Service</Link> ·{" "}
              <Link href="/refund-policy">Refund &amp; Return Policy</Link> ·{" "}
              <Link href="/shipping-policy">Shipping Policy</Link>
            </p>
          </section>
        </div>
      </div>
    </article>
  );
}
