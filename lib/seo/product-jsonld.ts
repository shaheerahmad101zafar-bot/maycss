import { MAYCSS_BUSINESS } from "@/lib/business";
import { STORE_SHIPPING } from "@/lib/commerce/shipping";
import { absoluteUrl } from "@/lib/seo/canonical";
import {
  buildProductReviewSnippet,
  resolveProductSocialProof,
} from "@/lib/seo/product-social-proof";
import { getSiteOrigin } from "@/lib/site-url";
import type { Product } from "@/lib/utils";

function stripHtml(text: string): string {
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteImageUrl(src: string): string {
  const raw = src.trim();
  if (!raw) return "";
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith("//")) return `https:${raw}`;
  return absoluteUrl(raw.startsWith("/") ? raw : `/${raw}`);
}

function productImages(product: Product): string[] {
  const urls = [product.image, ...(product.gallery ?? [])]
    .map((src) => (src ? absoluteImageUrl(src) : ""))
    .filter(Boolean);
  return Array.from(new Set(urls));
}

function productDescription(product: Product): string {
  const raw =
    product.description?.trim() ||
    product.seo?.metaDescription?.trim() ||
    "";
  if (raw) return stripHtml(raw).slice(0, 5000);
  const brand = product.brand?.trim() || MAYCSS_BUSINESS.storeName;
  return stripHtml(
    `${product.name} by ${brand} — curated fashion from MAYCSS. Prices in USD.`,
  ).slice(0, 5000);
}

function formatOfferPrice(amount: number): string {
  return amount.toFixed(2);
}

function offerItemCondition(product: Product): string {
  const hay =
    `${product.name} ${product.brand ?? ""} ${product.badge ?? ""}`.toLowerCase();
  if (/pre-?\s*owned|preowned|\bused\b|vintage|consignment/.test(hay)) {
    return "https://schema.org/UsedCondition";
  }
  return "https://schema.org/NewCondition";
}

function buildAggregateRating(product: Product): Record<string, unknown> {
  const proof = resolveProductSocialProof(product);
  return {
    "@type": "AggregateRating",
    ratingValue: String(proof.rating),
    reviewCount: String(proof.reviews),
    ratingCount: String(proof.reviews),
    bestRating: "5",
    worstRating: "1",
  };
}

function buildReviews(product: Product): Record<string, unknown>[] {
  const proof = resolveProductSocialProof(product);
  const snippet = buildProductReviewSnippet(product, proof);
  return [
    {
      "@type": "Review",
      "@id": `${absoluteUrl(`/product/${product.id}`)}#review-1`,
      name: `${product.name} review`,
      reviewBody: snippet.body,
      datePublished: snippet.datePublished,
      author: {
        "@type": "Person",
        name: snippet.author,
      },
      reviewRating: {
        "@type": "Rating",
        ratingValue: String(snippet.ratingValue),
        bestRating: "5",
        worstRating: "1",
      },
    },
  ];
}

function buildShippingDetails(): Record<string, unknown>[] {
  const destination = {
    "@type": "DefinedRegion",
    addressCountry: STORE_SHIPPING.destinationCountry,
  };
  const deliveryTime = {
    "@type": "ShippingDeliveryTime",
    handlingTime: {
      "@type": "QuantitativeValue",
      minValue: STORE_SHIPPING.handlingDaysMin,
      maxValue: STORE_SHIPPING.handlingDaysMax,
      unitCode: "DAY",
    },
    transitTime: {
      "@type": "QuantitativeValue",
      minValue: STORE_SHIPPING.transitDaysMin,
      maxValue: STORE_SHIPPING.transitDaysMax,
      unitCode: "DAY",
    },
  };

  return [
    {
      "@type": "OfferShippingDetails",
      "@id": `${getSiteOrigin()}/#shipping-standard`,
      shippingRate: {
        "@type": "MonetaryAmount",
        value: formatOfferPrice(STORE_SHIPPING.standardRateUsd),
        currency: STORE_SHIPPING.currency,
      },
      shippingDestination: destination,
      deliveryTime,
      shippingLabel: "Standard US shipping",
    },
    {
      "@type": "OfferShippingDetails",
      "@id": `${getSiteOrigin()}/#shipping-free`,
      shippingRate: {
        "@type": "MonetaryAmount",
        value: "0.00",
        currency: STORE_SHIPPING.currency,
      },
      shippingDestination: destination,
      deliveryTime,
      shippingLabel: `Free US shipping on orders $${STORE_SHIPPING.freeThresholdUsd}+`,
    },
  ];
}

function buildReturnPolicy(): Record<string, unknown> {
  return {
    "@type": "MerchantReturnPolicy",
    "@id": `${getSiteOrigin()}/#return-policy`,
    applicableCountry: STORE_SHIPPING.destinationCountry,
    returnPolicyCategory:
      "https://schema.org/MerchantReturnFiniteReturnWindow",
    merchantReturnDays: MAYCSS_BUSINESS.returnWindowDays,
    returnMethod: "https://schema.org/ReturnByMail",
    returnFees: "https://schema.org/ReturnFeesCustomerResponsibility",
    refundType: "https://schema.org/FullRefund",
    returnPolicyCountry: STORE_SHIPPING.destinationCountry,
    merchantReturnLink: absoluteUrl("/refund-policy"),
  };
}

/**
 * Schema.org Product JSON-LD for Google rich results + merchant listings.
 * Values are aligned with the PDP (price USD, stock, shipping, returns, ratings).
 */
export function buildProductJsonLd(product: Product): Record<string, unknown> {
  const origin = getSiteOrigin();
  const url = absoluteUrl(`/product/${product.id}`);
  const images = productImages(product);
  const availability =
    product.status === "draft"
      ? "https://schema.org/OutOfStock"
      : "https://schema.org/InStock";
  const brandName = product.brand?.trim() || MAYCSS_BUSINESS.storeName;
  const color = product.colors?.[0]?.name?.trim();
  const size = product.sizes?.[0]?.trim();
  const returnPolicy = buildReturnPolicy();
  const now = new Date();
  const validFrom = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 7)
    .toISOString()
    .slice(0, 10);
  const priceValidUntil = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 365)
    .toISOString()
    .slice(0, 10);

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    "@id": `${url}#offer`,
    url,
    price: formatOfferPrice(product.price),
    priceCurrency: "USD",
    availability,
    itemCondition: offerItemCondition(product),
    validFrom,
    priceValidUntil,
    seller: {
      "@type": "Organization",
      name: MAYCSS_BUSINESS.storeName,
      url: origin,
    },
    shippingDetails: buildShippingDetails(),
    hasMerchantReturnPolicy: returnPolicy,
  };

  if (
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price
  ) {
    offer.priceSpecification = [
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/SalePrice",
        price: formatOfferPrice(product.price),
        priceCurrency: "USD",
        validFrom,
        priceValidUntil,
      },
      {
        "@type": "UnitPriceSpecification",
        priceType: "https://schema.org/ListPrice",
        price: formatOfferPrice(product.originalPrice),
        priceCurrency: "USD",
      },
    ];
  }

  const data: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${url}#product`,
    name: product.name.trim(),
    description: productDescription(product),
    image: images.length > 0 ? images : undefined,
    sku: String(product.id),
    mpn: String(product.id),
    productID: String(product.id),
    url,
    brand: {
      "@type": "Brand",
      name: brandName,
    },
    category: product.category?.trim() || "Apparel & Accessories > Clothing",
    color: color || undefined,
    size: size || undefined,
    aggregateRating: buildAggregateRating(product),
    review: buildReviews(product),
    offers: offer,
    hasMerchantReturnPolicy: returnPolicy,
  };

  return JSON.parse(JSON.stringify(data)) as Record<string, unknown>;
}

export function buildProductBreadcrumbJsonLd(
  product: Product,
): Record<string, unknown> {
  const origin = getSiteOrigin();
  const items: { name: string; path: string }[] = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/shop" },
  ];
  if (product.category?.trim()) {
    items.push({ name: product.category.trim(), path: "/shop" });
  }
  items.push({ name: product.name, path: `/product/${product.id}` });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${origin}${item.path === "/" ? "/" : item.path}`,
    })),
  };
}
