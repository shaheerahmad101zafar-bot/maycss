import CategoryPage, {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import { getNewArrivals } from "@/lib/data";
import { withCanonical } from "@/lib/seo/canonical";
import type { Metadata } from "next";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const metadata: Metadata = withCanonical(
  {
    title: "New Arrivals · Fashion Products · MAYCSS",
    description:
      "Just landed at MAYCSS — new women clothes, dresses for women, jeans and denim, and curated fashion products from our online clothing store.",
    keywords: [
      "MAYCSS",
      "fashion products",
      "women clothes",
      "new arrivals",
      "clothing store",
    ],
  },
  "/new",
);

export default async function NewPage({ searchParams }: Props) {
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const products = await getNewArrivals();
  const { pageItems, totalCount, safePage } = paginateProducts(
    products,
    page,
    STOREFRONT_PAGE_SIZE,
  );

  return (
    <CategoryPage
      eyebrow="Just In"
      title="New Arrivals"
      subtitle="The freshest pieces to hit the floor this week — curated fashion products for the MAYCSS edit."
      products={pageItems}
      totalCount={totalCount}
      emptyLabel="No new arrivals yet — check back soon."
      page={safePage}
      basePath="/new"
    />
  );
}
