import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "@/components/contact/ContactForm";
import FeaturesStrip from "@/components/marketing/FeaturesStrip";
import { getAppConfig } from "@/lib/app-config";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { withCanonical } from "@/lib/seo/canonical";
import { getSiteOrigin } from "@/lib/site-url";

export async function generateMetadata(): Promise<Metadata> {
  return withCanonical(
    {
      title: "Contact Us | MAYCSS",
      description:
        "Contact MAYCSS customer support by email or phone. Business address: 1707 S Lee's Summit Rd, Independence, MO 64050, USA.",
      keywords: [
        "MAYCSS",
        "contact",
        "customer support",
        "clothing store",
      ],
    },
    "/contact",
  );
}

/**
 * Static Contact Us page for Google Merchant Center transparency checks.
 * Always shows real business identity — not dependent on CMS placeholders.
 */
export default async function ContactPage() {
  const cfg = await getAppConfig();
  const origin = getSiteOrigin();

  const storeName = cfg.siteName || MAYCSS_BUSINESS.storeName;
  const email = cfg.contactEmail || MAYCSS_BUSINESS.supportEmail;
  const phone = cfg.supportPhone || MAYCSS_BUSINESS.supportPhone;
  const phoneTel =
    phone.replace(/[^\d+]/g, "") || MAYCSS_BUSINESS.supportPhoneTel;
  const addressLines = (
    cfg.businessAddress || MAYCSS_BUSINESS.addressMultiline
  ).split("\n");
  const addressSingle =
    cfg.businessAddress?.replace(/\n/g, ", ") ||
    MAYCSS_BUSINESS.addressSingleLine;

  const mapQuery = encodeURIComponent(MAYCSS_BUSINESS.addressSingleLine);
  const mapEmbedSrc = `https://maps.google.com/maps?q=${mapQuery}&z=15&output=embed`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: `Contact ${storeName}`,
    url: `${origin}/contact`,
    mainEntity: {
      "@type": "Organization",
      name: storeName,
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
      contactPoint: {
        "@type": "ContactPoint",
        contactType: "customer support",
        email,
        telephone: phone,
        areaServed: "US",
        availableLanguage: "English",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mc-page mc-page--contact">
        <header className="mc-contact__hero">
          <div className="mc-container mc-contact__hero-inner">
            <p className="mc-contact__eyebrow">Contact Us</p>
            <h1 className="mc-contact__title">We&apos;re Here to Help</h1>
            <p className="mc-contact__lead">
              Reach {storeName} customer support by email or phone. Our business
              address and return destination are listed below for full
              transparency.
            </p>
          </div>
        </header>

        <div className="mc-container" style={{ padding: "56px 24px 24px" }}>
          <div className="mc-contact__grid">
            <aside className="mc-contact__details">
              <h2>{storeName} Customer Support</h2>
              <p className="mc-contact__details-lead">
                Official contact details for {storeName}. We typically respond
                within one business day (Monday–Friday, US Central Time).
              </p>
              <dl className="mc-contact__list">
                <div>
                  <dt>Store name</dt>
                  <dd>{storeName}</dd>
                </div>
                <div>
                  <dt>Business address</dt>
                  <dd>
                    <address style={{ fontStyle: "normal" }}>
                      {addressLines.map((line) => (
                        <span key={line}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </address>
                  </dd>
                </div>
                <div>
                  <dt>Support email</dt>
                  <dd>
                    <a href={`mailto:${email}`}>{email}</a>
                  </dd>
                </div>
                <div>
                  <dt>Support phone</dt>
                  <dd>
                    <a href={`tel:${phoneTel}`}>{phone}</a>
                  </dd>
                </div>
                <div>
                  <dt>Support hours</dt>
                  <dd>
                    Monday–Friday, 9:00 AM – 5:00 PM (US Central Time)
                    <br />
                    Closed weekends and US public holidays
                  </dd>
                </div>
                <div>
                  <dt>Mail-in returns</dt>
                  <dd>
                    Eligible items within {MAYCSS_BUSINESS.returnWindowDays}{" "}
                    days of delivery. See our{" "}
                    <Link href="/refund-policy">Refund &amp; Return Policy</Link>
                    .
                    <br />
                    <br />
                    {MAYCSS_BUSINESS.legalName} Returns
                    <br />
                    {MAYCSS_BUSINESS.addressLine1}
                    <br />
                    {MAYCSS_BUSINESS.city}, {MAYCSS_BUSINESS.state}{" "}
                    {MAYCSS_BUSINESS.postalCode}
                    <br />
                    {MAYCSS_BUSINESS.country}
                  </dd>
                </div>
                <div>
                  <dt>Helpful links</dt>
                  <dd>
                    <Link href="/shipping-policy">Shipping Policy</Link>
                    <br />
                    <Link href="/privacy-policy">Privacy Policy</Link>
                    <br />
                    <Link href="/terms-of-service">Terms of Service</Link>
                    <br />
                    <Link href="/about">About {storeName}</Link>
                  </dd>
                </div>
              </dl>
            </aside>

            <div className="mc-contact__form-wrap" id="contact-form">
              <h2>Send a Message</h2>
              <p className="mc-contact__form-lead">
                Share your order number (if you have one) and how we can help.
                You can also email us directly at{" "}
                <a href={`mailto:${email}`}>{email}</a>.
              </p>
              <ContactForm />
            </div>
          </div>
        </div>

        <div className="mc-container" style={{ padding: "24px 24px 64px" }}>
          <section className="mc-map-embed" aria-label="Business location map">
            <h2
              style={{
                fontFamily: "var(--mc-font-serif)",
                fontSize: "1.35rem",
                fontWeight: 400,
                margin: "0 0 12px",
              }}
            >
              Our business location
            </h2>
            <p
              style={{
                color: "var(--mc-gray-600)",
                lineHeight: 1.65,
                margin: "0 0 16px",
                maxWidth: 640,
              }}
            >
              {storeName} operates from {addressSingle}. This map shows our
              published business address used for mail-in returns and customer
              correspondence.
            </p>
            <div className="mc-map-embed__frame">
              <iframe
                title={`${storeName} business address map`}
                src={mapEmbedSrc}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        </div>
      </article>

      <FeaturesStrip />
    </>
  );
}
