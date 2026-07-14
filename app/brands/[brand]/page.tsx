import { notFound } from "next/navigation";
import CategoryPage from "@/components/products/CategoryPage";
import { getProductsByBrand } from "@/lib/data";

type PageProps = { params: Promise<{ brand: string }> };

export async function generateMetadata({ params }: PageProps) {
  const { brand } = await params;
  const name = decodeURIComponent(brand);
  return {
    title: `${name} · MayCSS`,
    description: `Shop ${name} at MayCSS.`,
  };
}

export default async function BrandPage({ params }: PageProps) {
  const { brand } = await params;
  const name = decodeURIComponent(brand);
  const products = await getProductsByBrand(name);
  if (products.length === 0) notFound();

  return (
    <CategoryPage
      eyebrow="The Maker"
      title={name}
      subtitle={`Everything from ${name}, curated for MayCSS.`}
      products={products}
    />
  );
}
