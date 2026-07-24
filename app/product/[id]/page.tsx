import { notFound } from "next/navigation";
import Link from "next/link";
import ProductDetail from "@/components/products/ProductDetail";
import ProductCard from "@/components/products/ProductCard";
import BlockRenderer from "@/components/cms/BlockRenderer";
import ProductJsonLd from "@/components/seo/ProductJsonLd";
import { getProductById, getRelatedProducts } from "@/lib/data";
import { withCanonical } from "@/lib/seo/canonical";
import type { Metadata } from "next";

type PageProps = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product not found · MAYCSS" };
  const title = product.seo?.metaTitle ?? `${product.name} · MAYCSS`;
  const description =
    product.seo?.metaDescription ??
    product.description ??
    `Shop ${product.name} at MAYCSS — curated fashion products online.`;
  return withCanonical(
    {
      title: { absolute: title },
      description,
      keywords: product.seo?.keywords ?? [
        "MAYCSS",
        "fashion products",
        product.brand,
        product.category,
      ].filter(Boolean) as string[],
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
    },
    `/product/${id}`,
  );
}

export default async function ProductPage({ params }: PageProps) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();
  // Draft products are not visible to the public.
  if (product.status === "draft") notFound();

  const related = (await getRelatedProducts(product, 8))
    .filter((p) => p.status !== "draft")
    .slice(0, 4);

  return (
    <>
      <ProductJsonLd product={product} />

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
 * Server-scoped sub-component — BlockRenderer stays pure (no full-catalog load).
 */
async function ProductContentSection({
  blocks,
}: {
  blocks: NonNullable<Awaited<ReturnType<typeof getProductById>>>["contentBlocks"];
}) {
  return (
    <section
      className="mc-section mc-container mc-product-content"
      aria-label="More about this product"
    >
      <BlockRenderer blocks={blocks ?? []} products={[]} hasPageH1 />
    </section>
  );
}
