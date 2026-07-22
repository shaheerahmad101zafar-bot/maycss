import { getAppConfig } from "@/lib/app-config";
import { MAYCSS_BUSINESS } from "@/lib/business";
import { getSiteOrigin } from "@/lib/site-url";
import { MAYCSS_PRIMARY_KEYWORDS } from "@/lib/seo/maycss-keywords";

/** Sitewide Organization + WebSite JSON-LD with GMC-aligned contact details. */
export default async function SiteJsonLd() {
  const origin = getSiteOrigin();
  const cfg = await getAppConfig();
  const email = cfg.contactEmail || MAYCSS_BUSINESS.supportEmail;
  const phone = cfg.supportPhone || MAYCSS_BUSINESS.supportPhone;
  const name = cfg.siteName || MAYCSS_BUSINESS.storeName;

  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name,
        alternateName: ["myacss", "MayCSS", "Shop MayCSS Online Store"],
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
        contactPoint: [
          {
            "@type": "ContactPoint",
            contactType: "customer support",
            email,
            telephone: phone,
            areaServed: "US",
            availableLanguage: ["English"],
          },
        ],
        description:
          "MAYCSS is an online fashion store for curated women clothes, dresses for women, jeans and denim, and fashion products — wholesale clothing energy with a luxury edit.",
        slogan: cfg.tagline || "Curated Luxury Fashion",
        knowsAbout: [...MAYCSS_PRIMARY_KEYWORDS],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name,
        publisher: { "@id": `${origin}/#organization` },
        potentialAction: {
          "@type": "SearchAction",
          target: `${origin}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
