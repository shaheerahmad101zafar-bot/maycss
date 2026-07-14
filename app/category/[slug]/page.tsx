import { notFound } from "next/navigation";
import Link from "next/link";
import CategoryPage from "@/components/products/CategoryPage";
import {
  getCategoryBySlug,
  getProductsByCategoryId,
  getSubcategories,
} from "@/lib/data";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  return {
    title: category ? `${category.name} · MayCSS` : "Category not found · MayCSS",
    description: category?.description ?? "Browse the MayCSS collection.",
  };
}

export default async function CategoryRoute({ params }: Props) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [products, subs] = await Promise.all([
    getProductsByCategoryId(category.id),
    getSubcategories(category.id),
  ]);

  return (
    <>
      <nav className="mc-crumbs mc-container" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span aria-hidden> / </span>
        <span className="mc-crumbs__current">{category.name}</span>
      </nav>

      {subs.length > 0 && (
        <section className="mc-section mc-cat-index">
          <div className="mc-container">
            <p className="mc-category__eyebrow">Explore</p>
            <h1 className="mc-category__title">{category.name}</h1>
            {category.description && (
              <p className="mc-category__subtitle">{category.description}</p>
            )}
            <div className="mc-cat-grid">
              {subs.map((c) => (
                <Link
                  key={c.id}
                  href={`/category/${category.slug}/${c.slug}`}
                  className="mc-cat-tile"
                >
                  <div className="mc-cat-tile__media">
                    {c.image && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={c.image} alt="" loading="lazy" />
                    )}
                  </div>
                  <div className="mc-cat-tile__body">
                    <h2>{c.name}</h2>
                    {c.description && <p>{c.description}</p>}
                    <span className="mc-cat-tile__cta">Shop {c.name} &rarr;</span>
                  </div>
                </Link>
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
        products={products}
        emptyLabel={`No pieces in ${category.name} right now.`}
      />
    </>
  );
}
