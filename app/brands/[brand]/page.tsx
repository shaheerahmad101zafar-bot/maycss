import { notFound } from "next/navigation";
import CategoryPage, {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import { getProductsByBrand } from "@/lib/data";
import { withCanonical } from "@/lib/seo/canonical";
import type { Metadata } from "next";

type PageProps = {
  params: Promise<{ brand: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { brand } = await params;
  const name = decodeURIComponent(brand);
  return withCanonical(
    {
      title: `${name} Fashion Products · MAYCSS`,
      description: `Shop ${name} at MAYCSS — curated fashion products, women clothes, and designer pieces from our online clothing store.`,
      keywords: ["MAYCSS", name, "fashion products", "clothing store"],
    },
    `/brands/${encodeURIComponent(name)}`,
  );
}

export default async function BrandPage({ params, searchParams }: PageProps) {
  const { brand } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const name = decodeURIComponent(brand);
  const products = await getProductsByBrand(name);
  if (products.length === 0) notFound();

  const { pageItems, totalCount, safePage } = paginateProducts(
    products,
    page,
    STOREFRONT_PAGE_SIZE,
  );

  return (
    <CategoryPage
      eyebrow="The Maker"
      title={name}
      subtitle={`Everything from ${name}, curated for MAYCSS.`}
      products={pageItems}
      totalCount={totalCount}
      page={safePage}
      basePath={`/brands/${encodeURIComponent(name)}`}
    />
  );
}
