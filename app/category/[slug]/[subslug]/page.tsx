import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryPage from "@/components/products/CategoryPage";
import CategoryPromoBanner from "@/components/products/CategoryPromoBanner";
import {
  getCategoryById,
  getCategoryBySlug,
  getProductsByCategoryId,
} from "@/lib/data";

type Props = { params: Promise<{ slug: string; subslug: string }> };

export async function generateMetadata({ params }: Props) {
  const { subslug } = await params;
  const category = await getCategoryBySlug(subslug);
  return {
    title: category ? `${category.name} · MayCSS` : "Category not found · MayCSS",
    description: category?.description ?? "Browse the MayCSS collection.",
  };
}

export default async function SubcategoryRoute({ params }: Props) {
  const { slug, subslug } = await params;
  const [parent, sub] = await Promise.all([
    getCategoryBySlug(slug),
    getCategoryBySlug(subslug),
  ]);
  if (!parent || !sub) notFound();
  if (sub.parentId !== parent.id) {
    const parentOfSub = sub.parentId
      ? await getCategoryById(sub.parentId)
      : undefined;
    if (parentOfSub?.slug !== parent.slug) notFound();
  }

  const products = await getProductsByCategoryId(sub.id);

  return (
    <>
      <CategoryPromoBanner
        categoryName={sub.name}
        categorySlug={parent.slug}
      />

      <nav className="mc-crumbs mc-container" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden> / </span>
        <Link href={`/category/${parent.slug}`}>{parent.name}</Link>
        <span aria-hidden> / </span>
        <span className="mc-crumbs__current">{sub.name}</span>
      </nav>

      <CategoryPage
        eyebrow={parent.name}
        title={sub.name}
        subtitle={sub.description}
        products={products}
        emptyLabel={`No pieces in ${sub.name} right now.`}
      />
    </>
  );
}
