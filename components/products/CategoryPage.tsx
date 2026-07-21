import Link from "next/link";
import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/lib/utils";

export const STOREFRONT_PAGE_SIZE = 24;

interface CategoryPageProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  /** Current page of products only (do not pass the full category list). */
  products: Product[];
  /** Total matching products across all pages. */
  totalCount: number;
  emptyLabel?: string;
  page?: number;
  basePath?: string;
  pageSize?: number;
}

export default function CategoryPage({
  title,
  eyebrow,
  subtitle,
  products,
  totalCount,
  emptyLabel = "No products to show right now.",
  page = 1,
  basePath,
  pageSize = STOREFRONT_PAGE_SIZE,
}: CategoryPageProps) {
  const total = totalCount;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return (
    <section className="mc-section mc-category">
      <div className="mc-container">
        <header className="mc-category__header">
          {eyebrow && <p className="mc-category__eyebrow">{eyebrow}</p>}
          <h1 className="mc-category__title">{title}</h1>
          {subtitle && <p className="mc-category__subtitle">{subtitle}</p>}
          <p className="mc-category__count" aria-live="polite">
            {total} {total === 1 ? "product" : "products"}
            {total > pageSize
              ? ` · showing ${start + 1}–${start + products.length}`
              : ""}
          </p>
        </header>

        {total === 0 ? (
          <p className="mc-category__empty">{emptyLabel}</p>
        ) : (
          <>
            <div className="mc-product-grid">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {basePath && totalPages > 1 && (
              <nav className="mc-pager" aria-label="Product pages">
                {safePage > 1 ? (
                  <Link
                    href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${safePage - 1}`}
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
                    href={`${basePath}${basePath.includes("?") ? "&" : "?"}page=${safePage + 1}`}
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
          </>
        )}
      </div>
    </section>
  );
}

export function paginateProducts<T>(
  items: T[],
  page: number,
  pageSize = STOREFRONT_PAGE_SIZE,
): { pageItems: T[]; totalCount: number; safePage: number; totalPages: number } {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  return {
    pageItems: items.slice(start, start + pageSize),
    totalCount,
    safePage,
    totalPages,
  };
}
