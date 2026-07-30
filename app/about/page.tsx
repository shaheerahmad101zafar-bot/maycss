import type { Metadata } from "next";
import Link from "next/link";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { withCanonical } from "@/lib/seo/canonical";
import { getSiteOrigin } from "@/lib/site-url";

export const metadata: Metadata = withCanonical(
  {
    title: "About MAYCSS | Online Fashion Store",
    description:
      "MAYCSS is an online fashion store based in Independence, MO. Contact myacssstore@gmail.com or +1 (501) 436-9308.",
    keywords: ["MAYCSS", "about", "online fashion store", "Independence MO"],
  },
  "/about",
);

/**
 * Static About page for Google Merchant Center business transparency.
 */
export default function AboutPage() {
  const email = MAYCSS_BUSINESS.supportEmail;
  const phone = MAYCSS_BUSINESS.supportPhone;
  const address = MAYCSS_BUSINESS.addressSingleLine;
  const origin = getSiteOrigin();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "About MAYCSS",
    url: `${origin}/about`,
    mainEntity: {
      "@type": "Organization",
      name: MAYCSS_BUSINESS.storeName,
      url: origin,
      email,
      telephone: phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: MAYCSS_BUSINESS.addressLine1,
        addressLocality: MAYCSS_BUSINESS.city,
        addressRegion: MAYCSS_BUSINESS.state,
        postalCode: MAYCSS_BUSINESS.postalCode,
        addressCountry: MAYCSS_BUSINESS.countryCode,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mc-page">
        <header className="mc-page__header">
          <div className="mc-container mc-page__header-inner">
            <p className="mc-page__eyebrow">Our story</p>
            <h1 className="mc-page__title">About MAYCSS</h1>
            <p className="mc-page__hero">
              An online fashion store with clear policies, real contact details,
              and curated clothing for everyday wear.
            </p>
          </div>
        </header>

        <div className="mc-container mc-page__body">
          <div className="mc-page__blocks" style={{ maxWidth: 720 }}>
            <section className="mc-block mc-block--richtext">
              <h2>Who we are</h2>
              <p>
                <strong>MAYCSS</strong> is an online clothing store at{" "}
                <a href={origin}>{origin.replace(/^https?:\/\//, "")}</a>. We
                offer women&apos;s clothing, dresses, denim, and everyday
                fashion essentials with transparent pricing and product
                information.
              </p>
              <p>
                We operate from the United States and ship orders across the US.
                Our published business address is used for customer
                correspondence and mail-in returns.
              </p>
            </section>

            <section className="mc-block mc-block--richtext">
              <h2>Business information</h2>
              <p>
                <strong>Legal / store name:</strong> {MAYCSS_BUSINESS.legalName}
                <br />
                <strong>Address:</strong> {address}
                <br />
                <strong>Email:</strong>{" "}
                <a href={`mailto:${email}`}>{email}</a>
                <br />
                <strong>Phone:</strong>{" "}
                <a href={`tel:${MAYCSS_BUSINESS.supportPhoneTel}`}>{phone}</a>
              </p>
              <p>
                Prefer a form? Visit our{" "}
                <Link href="/contact">Contact Us</Link> page.
              </p>
            </section>

            <section className="mc-block mc-block--richtext">
              <h2>How we work</h2>
              <p>
                We aim to keep shopping straightforward: accurate product
                details, clear shipping estimates, and a published{" "}
                {MAYCSS_BUSINESS.returnWindowDays}-day return window for
                eligible items. If something is wrong with an order, our support
                team can help by email or phone.
              </p>
            </section>

            <section className="mc-block mc-block--richtext">
              <h2>Customer policies</h2>
              <p>All store policies are publicly available:</p>
              <ul>
                <li>
                  <Link href="/shipping-policy">Shipping Policy</Link>
                </li>
                <li>
                  <Link href="/refund-policy">Refund &amp; Return Policy</Link>
                </li>
                <li>
                  <Link href="/privacy-policy">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms-of-service">Terms of Service</Link>
                </li>
              </ul>
            </section>

            <section className="mc-block mc-block--richtext">
              <h2>Get in touch</h2>
              <p>
                Questions about an order, sizing, or a return? Email{" "}
                <a href={`mailto:${email}`}>{email}</a>, call {phone}, or use{" "}
                <Link href="/contact">Contact Us</Link>. We typically respond
                within one business day.
              </p>
            </section>
          </div>
        </div>
      </article>
    </>
  );
}
