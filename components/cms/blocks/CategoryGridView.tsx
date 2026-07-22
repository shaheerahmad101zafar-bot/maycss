import Link from "next/link";
import type { CategoryGridBlock } from "@/lib/blocks/types";
import { tileImageUrl } from "@/lib/images/cdn-url";
import { categoryImageAlt } from "@/lib/seo/image-alt";
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
          {items.map((cat) => {
            const subs = categories
              .filter((c) => c.parentId === cat.id)
              .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
            return (
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
                  {subs.length > 0 && (
                    <ul className="mc-cat-block__pills" aria-label={`${cat.name} subcategories`}>
                      {subs.map((s) => (
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
                  <Link
                    href={`/category/${cat.slug}`}
                    className="mc-cat-block__all"
                  >
                    Shop all {cat.name}
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
