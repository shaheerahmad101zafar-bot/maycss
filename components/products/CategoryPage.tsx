import ProductCard from "@/components/products/ProductCard";
import type { Product } from "@/lib/utils";

interface CategoryPageProps {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  products: Product[];
  emptyLabel?: string;
}

export default function CategoryPage({
  title,
  eyebrow,
  subtitle,
  products,
  emptyLabel = "No products to show right now.",
}: CategoryPageProps) {
  return (
    <section className="mc-section mc-category">
      <div className="mc-container">
        <header className="mc-category__header">
          {eyebrow && <p className="mc-category__eyebrow">{eyebrow}</p>}
          <h1 className="mc-category__title">{title}</h1>
          {subtitle && <p className="mc-category__subtitle">{subtitle}</p>}
          <p className="mc-category__count" aria-live="polite">
            {products.length}{" "}
            {products.length === 1 ? "product" : "products"}
          </p>
        </header>

        {products.length === 0 ? (
          <p className="mc-category__empty">{emptyLabel}</p>
        ) : (
          <div className="mc-product-grid">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
