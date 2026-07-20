import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { getProducts } from "@/lib/data";
import { cx } from "@/lib/utils";
import ProductsAdminTable from "@/components/admin/ProductsAdminTable";

export const metadata = { title: "Products · Admin · MayCSS" };

type Props = {
  searchParams: Promise<{ filter?: string; deleted?: string; error?: string }>;
};

export default async function AdminProductsPage({ searchParams }: Props) {
  noStore();
  const { filter, deleted, error } = await searchParams;
  const all = await getProducts();
  const drafts = all.filter((p) => p.status === "draft");
  const published = all.filter((p) => p.status !== "draft");

  const shown =
    filter === "drafts"
      ? drafts
      : filter === "published"
        ? published
        : all;

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Products</h1>
          <p>
            {all.length} in your catalog · {published.length} published ·{" "}
            <strong>{drafts.length} drafts</strong>
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
          href="/admin/products"
          role="tab"
          aria-selected={!filter}
          className={cx("mc-admin__tab", !filter && "is-active")}
        >
          All
          <span className="mc-admin__tab-count">{all.length}</span>
        </Link>
        <Link
          href="/admin/products?filter=published"
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
          href="/admin/products?filter=drafts"
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

      <ProductsAdminTable products={shown} filter={filter} />
    </section>
  );
}
