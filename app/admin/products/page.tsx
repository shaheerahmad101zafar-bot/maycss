import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getCategories, getProducts } from "@/lib/data";
import { cx } from "@/lib/utils";
import ProductsAdminTable from "@/components/admin/ProductsAdminTable";

export const metadata = { title: "Products · Admin · MayCSS" };

type Props = {
  searchParams: Promise<{
    filter?: string;
    category?: string;
    deleted?: string;
    error?: string;
  }>;
};

function buildHref(opts: { filter?: string; category?: string }) {
  const params = new URLSearchParams();
  if (opts.filter) params.set("filter", opts.filter);
  if (opts.category) params.set("category", opts.category);
  const qs = params.toString();
  return qs ? `/admin/products?${qs}` : "/admin/products";
}

export default async function AdminProductsPage({ searchParams }: Props) {
  noStore();
  const { filter, category, deleted, error } = await searchParams;
  const [all, categories] = await Promise.all([
    getProducts(),
    getCategories(),
  ]);
  const drafts = all.filter((p) => p.status === "draft");
  const published = all.filter((p) => p.status !== "draft");

  const byStatus =
    filter === "drafts"
      ? drafts
      : filter === "published"
        ? published
        : all;

  const categoryMap = Object.fromEntries(
    categories.map((c) => [c.id, c.name]),
  );

  const shown =
    category === "none"
      ? byStatus.filter((p) => !p.categoryId)
      : category
        ? byStatus.filter((p) => p.categoryId === category)
        : byStatus;

  const formalCount = all.filter((p) => p.categoryId === "cat_formal").length;
  const uncategorizedCount = all.filter((p) => !p.categoryId).length;

  const categoryTabs = [
    ...categories
      .slice()
      .sort((a, b) => {
        const aScore = a.id === "cat_formal" ? -1 : (a.order ?? 0);
        const bScore = b.id === "cat_formal" ? -1 : (b.order ?? 0);
        return aScore - bScore || a.name.localeCompare(b.name);
      })
      .map((c) => ({
        id: c.id,
        label: c.parentId
          ? `${categoryMap[c.parentId] ?? ""} › ${c.name}`.replace(/^ › /, "")
          : c.name,
        count: all.filter((p) => p.categoryId === c.id).length,
      }))
      .filter((t) => t.count > 0 || t.id === "cat_formal" || t.id === "cat_jeans"),
    ...(uncategorizedCount > 0
      ? [{ id: "none", label: "Uncategorized", count: uncategorizedCount }]
      : []),
  ];

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Products</h1>
          <p>
            {all.length} in your catalog · {published.length} published ·{" "}
            <strong>{drafts.length} drafts</strong>
            {formalCount > 0 && (
              <>
                {" "}
                ·{" "}
                <Link
                  href={buildHref({ category: "cat_formal", filter })}
                  className="mc-admin__link"
                >
                  {formalCount} Formal
                </Link>
              </>
            )}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link
            href="/admin/products/import"
            className="mc-btn mc-btn--ghost"
          >
            ✨ Import from URL
          </Link>
          <Link href="/admin/products/new" className="mc-btn mc-btn--primary">
            + New Product
          </Link>
        </div>
      </header>

      {deleted && (
        <p className="mc-admin__banner" role="status">
          Deleted {deleted === "1" ? "1 product" : `${deleted} products`}.
        </p>
      )}
      {error === "delete-failed" && (
        <p className="mc-admin__banner is-error" role="alert">
          Delete failed — check Vercel Blob storage, then try again.
        </p>
      )}
      {error === "none-selected" && (
        <p className="mc-admin__banner is-error" role="alert">
          Select at least one product to delete.
        </p>
      )}

      <div className="mc-admin__tabs" role="tablist">
        <Link
          href={buildHref({ category })}
          role="tab"
          aria-selected={!filter}
          className={cx("mc-admin__tab", !filter && "is-active")}
        >
          All
          <span className="mc-admin__tab-count">{all.length}</span>
        </Link>
        <Link
          href={buildHref({ filter: "published", category })}
          role="tab"
          aria-selected={filter === "published"}
          className={cx(
            "mc-admin__tab",
            filter === "published" && "is-active",
          )}
        >
          Published
          <span className="mc-admin__tab-count">{published.length}</span>
        </Link>
        <Link
          href={buildHref({ filter: "drafts", category })}
          role="tab"
          aria-selected={filter === "drafts"}
          className={cx(
            "mc-admin__tab",
            filter === "drafts" && "is-active",
            drafts.length > 0 && "has-alert",
          )}
        >
          Drafts
          <span className="mc-admin__tab-count">{drafts.length}</span>
        </Link>
      </div>

      <div className="mc-admin__tabs mc-admin__tabs--secondary" role="tablist" aria-label="Filter by category">
        <Link
          href={buildHref({ filter })}
          role="tab"
          aria-selected={!category}
          className={cx("mc-admin__tab", !category && "is-active")}
        >
          Every category
        </Link>
        {categoryTabs.map((tab) => (
          <Link
            key={tab.id}
            href={buildHref({ filter, category: tab.id })}
            role="tab"
            aria-selected={category === tab.id}
            className={cx(
              "mc-admin__tab",
              category === tab.id && "is-active",
              tab.id === "cat_formal" && "has-alert",
            )}
          >
            {tab.label}
            <span className="mc-admin__tab-count">{tab.count}</span>
          </Link>
        ))}
      </div>

      <ProductsAdminTable
        products={shown}
        filter={filter}
        categoryNames={categoryMap}
      />
    </section>
  );
}
