import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetail from "@/components/products/ProductDetail";
import ProductCard from "@/components/products/ProductCard";
import BlockRenderer from "@/components/cms/BlockRenderer";
import { getProductById, getProducts, getRelatedProducts } from "@/lib/data";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product not found · MayCSS" };
  const title = product.seo?.metaTitle ?? `${product.name} · MayCSS`;
  const description =
    product.seo?.metaDescription ?? product.description ?? product.name;
  return {
    title,
    description,
    keywords: product.seo?.keywords,
    openGraph: {
      title,
      description,
      type: "website",
      images: [product.seo?.ogImage ?? product.image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [product.seo?.ogImage ?? product.image],
    },
  };
}

/**
 * Schema.org Product JSON-LD — helps Google show rich product results
 * (image, price, ratings) directly in search.
 */
function buildProductJsonLd(product: Awaited<ReturnType<typeof getProductById>>): string {
  if (!product) return "";
  const onSale =
    typeof product.originalPrice === "number" &&
    product.originalPrice > product.price;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image:
      product.gallery && product.gallery.length > 0
        ? product.gallery
        : [product.image],
    brand: product.brand ? { "@type": "Brand", name: product.brand } : undefined,
    sku: String(product.id),
    aggregateRating:
      typeof product.rating === "number"
        ? {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviews ?? 0,
          }
        : undefined,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      ...(onSale && product.originalPrice
        ? {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: product.price,
              priceCurrency: "USD",
              referencePrice: product.originalPrice,
            },
          }
        : {}),
    },
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  // Draft products are not visible to the public.
  if (product.status === "draft") notFound();

  const related = (await getRelatedProducts(product, 8)).filter(
    (p) => p.status !== "draft",
  ).slice(0, 4);
  const jsonLd = buildProductJsonLd(product);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd }}
      />

      <nav className="mc-crumbs mc-container" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden> / </span>
        <Link href="/shop">Shop</Link>
        {product.category && (
          <>
            <span aria-hidden> / </span>
            <span className="mc-crumbs__current">{product.category}</span>
          </>
        )}
      </nav>

      <ProductDetail product={product} />

      {product.contentBlocks && product.contentBlocks.length > 0 && (
        <ProductContentSection blocks={product.contentBlocks} />
      )}

      {related.length > 0 && (
        <section className="mc-section mc-related" aria-labelledby="related-heading">
          <div className="mc-container">
            <header className="mc-section-header">
              <p className="mc-section-subtitle">Complete the look</p>
              <h2 id="related-heading" className="mc-section-title">
                You May Also Like
              </h2>
            </header>
            <div className="mc-product-grid">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

/**
 * Server-scoped sub-component that fetches the product catalog once so the
 * BlockRenderer stays pure (no server-only imports leak into the client).
 */
async function ProductContentSection({
  blocks,
}: {
  blocks: NonNullable<Awaited<ReturnType<typeof getProductById>>>["contentBlocks"];
}) {
  const products = await getProducts();
  return (
    <section
      className="mc-section mc-container mc-product-content"
      aria-label="More about this product"
    >
      <BlockRenderer blocks={blocks ?? []} products={products} />
    </section>
  );
}
