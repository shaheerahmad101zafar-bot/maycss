import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import { getSubcategories, getTopLevelCategories } from "@/lib/data";
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
            Every piece, organised the way we shop.
          </p>
        </header>

        <div className="mc-cat-grid">
          {withSubs.map((cat) => (
            <div key={cat.id} className="mc-cat-tile mc-cat-tile--parent">
              <Link
                href={`/category/${cat.slug}`}
                className="mc-cat-tile__media"
                aria-label={cat.name}
              >
                {cat.image && (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={cat.image}
                    alt=""
                    loading="lazy"
                    width={400}
                    height={500}
                  />
                )}
              </Link>
              <div className="mc-cat-tile__body">
                <h3>
                  <Link href={`/category/${cat.slug}`}>{cat.name}</Link>
                </h3>
                {cat.description && <p>{cat.description}</p>}
                {cat.subs.length > 0 && (
                  <ul className="mc-cat-tile__subs">
                    {cat.subs.map((s) => (
                      <li key={s.id}>
                        <Link href={`/category/${cat.slug}/${s.slug}`}>
                          {s.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
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
