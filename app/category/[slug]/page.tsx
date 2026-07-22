import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryPage, {
  paginateProducts,
  STOREFRONT_PAGE_SIZE,
} from "@/components/products/CategoryPage";
import CategoryPromoBanner from "@/components/products/CategoryPromoBanner";
import {
  getCategoryBySlug,
  getProductsByCategoryId,
  getSubcategories,
} from "@/lib/data";
import {
  categoryBreadcrumbJsonLd,
  categoryToMetadata,
} from "@/lib/seo/category-metadata";
import { getSiteOrigin } from "@/lib/site-url";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return categoryToMetadata(category);
}

export default async function CategoryRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageRaw } = await searchParams;
  const page = Math.max(1, Number(pageRaw) || 1);
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [rawProducts, subs] = await Promise.all([
    getProductsByCategoryId(category.id),
    getSubcategories(category.id),
  ]);
  const { pageItems, totalCount, safePage } = paginateProducts(
    rawProducts,
    page,
    STOREFRONT_PAGE_SIZE,
  );

  const showHeroBanner =
    !category.parentId ||
    category.slug === "womens-clothing" ||
    category.slug === "womens-dresses" ||
    category.slug === "womens-jeans-denim";

  const breadcrumbLd = categoryBreadcrumbJsonLd({
    origin: getSiteOrigin(),
    items: [
      { name: "Home", path: "/" },
      { name: category.name, path: `/category/${category.slug}` },
    ],
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: breadcrumbLd }}
      />
      {showHeroBanner && (
        <CategoryPromoBanner
          categoryName={category.name}
          categorySlug={category.slug}
        />
      )}

      <nav className="mc-crumbs mc-container" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden> / </span>
        <span className="mc-crumbs__current">{category.name}</span>
      </nav>

      {subs.length > 0 && (
        <section className="mc-section mc-cat-index">
          <div className="mc-container">
            <p className="mc-category__eyebrow">Shop by style</p>
            <h1 className="mc-category__title">{category.name}</h1>
            {category.description && (
              <p className="mc-category__subtitle">{category.description}</p>
            )}
            <ul className="mc-cat-block__pills mc-cat-block__pills--page" aria-label="Subcategories">
              {subs.map((c) => (
                <li key={c.id}>
                  <Link
                    href={`/category/${category.slug}/${c.slug}`}
                    className="mc-cat-block__pill"
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mc-cat-showcase__grid" style={{ marginTop: "1.25rem" }}>
              {subs.map((c) => (
                <article key={c.id} className="mc-cat-block">
                  <Link
                    href={`/category/${category.slug}/${c.slug}`}
                    className="mc-cat-block__media"
                    aria-label={c.name}
                  >
                    {c.image ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={c.image}
                        alt={`${c.name} — MAYCSS`}
                        loading="lazy"
                      />
                    ) : (
                      <span className="mc-cat-block__fallback" aria-hidden />
                    )}
                  </Link>
                  <div className="mc-cat-block__body">
                    <h2 className="mc-cat-block__title">
                      <Link href={`/category/${category.slug}/${c.slug}`}>
                        {c.name}
                      </Link>
                    </h2>
                    {c.description && (
                      <p className="mc-cat-block__desc">{c.description}</p>
                    )}
                    <Link
                      href={`/category/${category.slug}/${c.slug}`}
                      className="mc-cat-block__all"
                    >
                      Shop {c.name}
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <CategoryPage
        eyebrow={subs.length > 0 ? "All in " + category.name : "The Collection"}
        title={subs.length > 0 ? `Everything in ${category.name}` : category.name}
        subtitle={
          subs.length > 0
            ? "Every piece across every sub-category."
            : category.description
        }
        products={pageItems}
        totalCount={totalCount}
        emptyLabel={`No pieces in ${category.name} right now.`}
        page={safePage}
        basePath={`/category/${category.slug}`}
      />
    </>
  );
}
