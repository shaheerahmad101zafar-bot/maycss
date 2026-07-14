import CategoryPage from "@/components/products/CategoryPage";
import { getNewArrivals } from "@/lib/data";

export const metadata = {
  title: "New Arrivals · MayCSS",
  description: "Just landed at MayCSS.",
};

export default async function NewPage() {
  const products = await getNewArrivals();
  return (
    <CategoryPage
      eyebrow="Just In"
      title="New Arrivals"
      subtitle="The freshest pieces to hit the floor this week."
      products={products}
      emptyLabel="No new arrivals yet — check back soon."
    />
  );
}
