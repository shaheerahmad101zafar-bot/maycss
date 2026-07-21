import Link from "next/link";
import type { CategoryGridBlock } from "@/lib/blocks/types";
import type { Category } from "@/lib/utils";

export default function CategoryGridView({
  block,
  categories,
}: {
  block: CategoryGridBlock;
  categories?: Category[];
}) {
  if (!categories) {
    return (
      <section className="mc-block mc-block--categorygrid mc-block--placeholder">
        {block.heading && <h2 className="mc-block__heading">{block.heading}</h2>}
        <p className="mc-admin__hint" style={{ textAlign: "center" }}>
          Category grid — live categories appear on the storefront.
        </p>
      </section>
    );
  }

  let list = categories.filter((c) => !c.parentId);
  if (block.categoryIds && block.categoryIds.length > 0) {
    const byId = new Map(categories.map((c) => [c.id, c]));
    list = block.categoryIds
      .map((id) => byId.get(id))
      .filter((c): c is Category => Boolean(c));
  } else {
    list = list.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }
  const limit = block.limit ?? 5;
  const items = list.slice(0, limit);
  if (items.length === 0) return null;

  return (
    <section className="mc-block mc-block--categorygrid mc-cat-showcase">
      <div className="mc-container">
        {(block.eyebrow || block.heading || block.subheading) && (
          <header className="mc-section-header">
            {block.eyebrow && (
              <p className="mc-section-subtitle">{block.eyebrow}</p>
            )}
            {block.heading && (
              <h2 className="mc-section-title">{block.heading}</h2>
            )}
            {block.subheading && (
              <p className="mc-section-header__lead">{block.subheading}</p>
            )}
          </header>
        )}
        <div className="mc-cat-showcase__grid">
          {items.map((cat) => (
            <Link
              key={cat.id}
              href={`/category/${cat.slug}`}
              className="mc-cat-showcase__tile"
            >
              <span className="mc-cat-showcase__media">
                {cat.image ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={cat.image} alt="" loading="lazy" />
                ) : (
                  <span className="mc-cat-showcase__fallback" aria-hidden />
                )}
              </span>
              <span className="mc-cat-showcase__label">{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
