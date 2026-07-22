import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { getSubcategories, getTopLevelCategories } from "@/lib/data";
import { tileImageUrl } from "@/lib/images/cdn-url";
import { categoryImageAlt } from "@/lib/seo/image-alt";
import type { Category, Product } from "@/lib/utils";
import { STOREFRONT_PAGE_SIZE } from "@/components/products/CategoryPage";

export default async function ShopCategoryIndex() {
  const topCats = await getTopLevelCategories();
  const withSubs: (Category & { subs: Category[] })[] = await Promise.all(
    topCats.map(async (c) => ({
      ...c,
      subs: await getSubcategories(c.id),
    })),
  );

  if (withSubs.length === 0) return null;

  return (
    <section className="mc-section mc-cat-index mc-cat-index--cms">
      <div className="mc-container">
        <header className="mc-section-header">
          <p className="mc-section-subtitle">Browse</p>
          <h2 className="mc-section-title">Shop by Category</h2>
          <p className="mc-section-header__lead">
            Every piece, organised the way we shop — open a category or jump
            straight to a style.
          </p>
        </header>

        <div className="mc-cat-showcase__grid">
          {withSubs.map((cat) => (
            <article key={cat.id} className="mc-cat-block">
              <Link
                href={`/category/${cat.slug}`}
                className="mc-cat-block__media"
                aria-label={`Shop ${cat.name}`}
              >
                {cat.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={tileImageUrl(cat.image)}
                    alt={categoryImageAlt(cat.name)}
                    loading="lazy"
                    width={560}
                    height={420}
                    decoding="async"
                  />
                ) : (
                  <span className="mc-cat-block__fallback" aria-hidden />
                )}
              </Link>
              <div className="mc-cat-block__body">
                <h3 className="mc-cat-block__title">
                  <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                </h3>
                {cat.description && (
                  <p className="mc-cat-block__desc">{cat.description}</p>
                )}
                {cat.subs.length > 0 && (
                  <ul
                    className="mc-cat-block__pills"
                    aria-label={`${cat.name} subcategories`}
                  >
                    {cat.subs.map((s) => (
                      <li key={s.id}>
                        <Link
                          href={`/category/${cat.slug}/${s.slug}`}
                          className="mc-cat-block__pill"
                        >
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
                <Link href={`/category/${cat.slug}`} className="mc-cat-block__all">
                  Shop all {cat.name}
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export async function ShopCatalogSection({
  products,
  totalCount,
  page = 1,
  basePath = "/shop",
  pageSize = STOREFRONT_PAGE_SIZE,
}: {
  /** Current page of products only. */
  products: Product[];
  totalCount: number;
  page?: number;
  basePath?: string;
  pageSize?: number;
}) {
  if (totalCount === 0) return null;

  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const joiner = basePath.includes("?") ? "&" : "?";

  return (
    <section className="mc-section mc-category">
      <div className="mc-container">
        <header className="mc-section-header">
          <p className="mc-section-subtitle">The Collection</p>
          <h2 className="mc-section-title">Every Piece</h2>
          <p className="mc-section-header__lead">
            {totalCount} products · showing {start + 1}–{start + products.length}
          </p>
        </header>
        <div className="mc-product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        {totalPages > 1 && (
          <nav className="mc-pager" aria-label="Product pages">
            {safePage > 1 ? (
              <Link
                href={`${basePath}${joiner}page=${safePage - 1}`}
                className="mc-pager__btn"
                rel="prev"
              >
                Previous
              </Link>
            ) : (
              <span className="mc-pager__btn is-disabled">Previous</span>
            )}
            <span className="mc-pager__status">
              Page {safePage} of {totalPages}
            </span>
            {safePage < totalPages ? (
              <Link
                href={`${basePath}${joiner}page=${safePage + 1}`}
                className="mc-pager__btn"
                rel="next"
              >
                Next
              </Link>
            ) : (
              <span className="mc-pager__btn is-disabled">Next</span>
            )}
          </nav>
        )}
      </div>
    </section>
  );
}
