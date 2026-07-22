import { getSiteOrigin } from "@/lib/site-url";
import { MAYCSS_PRIMARY_KEYWORDS } from "@/lib/seo/maycss-keywords";

/** Sitewide Organization + WebSite JSON-LD (luxury brand, keyword-aware). */
export default function SiteJsonLd() {
  const origin = getSiteOrigin();
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "MAYCSS",
        alternateName: ["myacss", "MayCSS", "Shop MayCSS Online Store"],
        url: origin,
        description:
          "MAYCSS is an online fashion store for curated women clothes, dresses for women, jeans and denim, and fashion products — wholesale clothing energy with a luxury edit.",
        slogan: "Curated Luxury Fashion",
        knowsAbout: [...MAYCSS_PRIMARY_KEYWORDS],
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        url: origin,
        name: "MAYCSS",
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
