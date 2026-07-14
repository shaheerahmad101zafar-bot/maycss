import Link from "next/link";
import { getProducts } from "@/lib/data";
import { cx, formatPrice } from "@/lib/utils";
import DeleteProductButton from "@/components/admin/DeleteProductButton";

export const metadata = { title: "Products · Admin · MayCSS" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminProductsPage({ searchParams }: Props) {
  const { filter } = await searchParams;
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

      <div className="mc-admin__table-wrap">
        <table className="mc-admin__table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Status</th>
              <th scope="col">Brand</th>
              <th scope="col">Price</th>
              <th scope="col">Badge</th>
              <th scope="col" aria-label="Actions" />
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={p.id}>
                <td>
                  <div className="mc-admin__row-product">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" />
                    <div>
                      <p className="mc-admin__row-name">{p.name}</p>
                      <p className="mc-admin__row-id">ID {p.id}</p>
                    </div>
                  </div>
                </td>
                <td>
                  {p.status === "draft" ? (
                    <span className="mc-status-pill is-status-hold">Draft</span>
                  ) : (
                    <span className="mc-status-pill is-status-completed">
                      Published
                    </span>
                  )}
                </td>
                <td>{p.brand || "—"}</td>
                <td>
                  <div className="mc-admin__price-cell">
                    <span>{formatPrice(p.price)}</span>
                    {p.originalPrice && <s>{formatPrice(p.originalPrice)}</s>}
                  </div>
                </td>
                <td>
                  {p.badge ? (
                    <span className="mc-admin__pill">{p.badge}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>
                  <div className="mc-admin__actions">
                    <Link
                      href={`/admin/products/${p.id}/edit`}
                      className="mc-admin__link"
                    >
                      Edit
                    </Link>
                    <DeleteProductButton id={p.id} name={p.name} />
                  </div>
                </td>
              </tr>
            ))}
            {shown.length === 0 && (
              <tr>
                <td colSpan={6} className="mc-admin__empty-cell">
                  {filter === "drafts"
                    ? "No drafts right now."
                    : "No products yet. Create one or import from a URL."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
