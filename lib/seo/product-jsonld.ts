import { MAYCSS_BUSINESS } from "@/lib/business";
import { STORE_SHIPPING } from "@/lib/commerce/shipping";
import { absoluteUrl } from "@/lib/seo/canonical";
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
  const urls = [
    product.image,
    ...(product.gallery ?? []),
  ]
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

/** Valid aggregate rating only when the PDP can show the same numbers. */
function buildAggregateRating(product: Product): Record<string, unknown> | null {
  if (typeof product.rating !== "number" || !Number.isFinite(product.rating)) {
    return null;
  }
  const ratingValue = Math.min(5, Math.max(1, Math.round(product.rating * 10) / 10));
  const reviewCount =
    typeof product.reviews === "number" && product.reviews > 0
      ? Math.floor(product.reviews)
      : 0;
  if (reviewCount < 1) return null;
  return {
    "@type": "AggregateRating",
    ratingValue: String(ratingValue),
    reviewCount: String(reviewCount),
    ratingCount: String(reviewCount),
    bestRating: "5",
    worstRating: "1",
  };
}

/** Individual Review nodes — reserved for real on-page reviews only. */
function buildReviews(_product: Product): Record<string, unknown>[] | null {
  // Do not invent customer reviews for schema. When a review system is added,
  // map visible PDP reviews here so JSON-LD matches the page.
  return null;
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
 * Values are aligned with the PDP (price USD, stock, shipping, returns).
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
  const aggregateRating = buildAggregateRating(product);
  const reviews = buildReviews(product);
  const color = product.colors?.[0]?.name?.trim();
  const size = product.sizes?.[0]?.trim();

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    "@id": `${url}#offer`,
    url,
    price: formatOfferPrice(product.price),
    priceCurrency: "USD",
    availability,
    itemCondition: "https://schema.org/NewCondition",
    priceValidUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365)
      .toISOString()
      .slice(0, 10),
    seller: {
      "@type": "Organization",
      name: MAYCSS_BUSINESS.storeName,
      url: origin,
    },
    shippingDetails: buildShippingDetails(),
    hasMerchantReturnPolicy: buildReturnPolicy(),
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
    material: undefined,
    color: color || undefined,
    size: size || undefined,
    offers: offer,
  };

  if (aggregateRating) data.aggregateRating = aggregateRating;
  if (reviews) data.review = reviews;

  // Drop undefined keys for clean JSON-LD.
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
