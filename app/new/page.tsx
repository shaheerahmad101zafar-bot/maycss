import CategoryPage, {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import { getNewArrivals } from "@/lib/data";

type Props = {
  searchParams: Promise<{ page?: string }>;
};

export const metadata = {
  title: "New Arrivals · MayCSS",
  description: "Just landed at MayCSS.",
};

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
      subtitle="The freshest pieces to hit the floor this week."
      products={pageItems}
      totalCount={totalCount}
      emptyLabel="No new arrivals yet — check back soon."
      page={safePage}
      basePath="/new"
    />
  );
}
