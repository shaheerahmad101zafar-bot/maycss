import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryPage, {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import CategoryPromoBanner from "@/components/products/CategoryPromoBanner";
import {
  getCategoryById,
  getCategoryBySlug,
  getProductsByCategoryId,
} from "@/lib/data";
import {
  categoryBreadcrumbJsonLd,
  categoryToMetadata,
} from "@/lib/seo/category-metadata";
import { getSiteOrigin } from "@/lib/site-url";

type Props = {
  params: Promise<{ slug: string; subslug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug, subslug } = await params;
  const category = await getCategoryBySlug(subslug);
  return categoryToMetadata(category, {
    path: `/category/${slug}/${subslug}`,
  });
}

export default async function SubcategoryRoute({ params, searchParams }: Props) {
  const { slug, subslug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
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

  const rawProducts = await getProductsByCategoryId(sub.id);
  const { pageItems, totalCount, safePage } = paginateProducts(
    rawProducts,
    page,
    STOREFRONT_PAGE_SIZE,
  );

  const breadcrumbLd = categoryBreadcrumbJsonLd({
    origin: getSiteOrigin(),
    items: [
      { name: "Home", path: "/" },
      { name: parent.name, path: `/category/${parent.slug}` },
      { name: sub.name, path: `/category/${parent.slug}/${sub.slug}` },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />
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
        products={pageItems}
        totalCount={totalCount}
        emptyLabel={`No pieces in ${sub.name} right now.`}
        page={safePage}
        basePath={`/category/${parent.slug}/${sub.slug}`}
      />
    </>
  );
}
