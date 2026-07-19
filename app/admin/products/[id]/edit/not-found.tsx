import Link from "next/link";

export default function ProductEditNotFound() {
  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Product not found</h1>
          <p>
            That draft may still be syncing, or the link is out of date. Open
            Products and check Drafts — then edit and publish from there.
          </p>
        </div>
      </header>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <Link
          href="/admin/products?filter=drafts"
          className="mc-btn mc-btn--primary"
        >
          Open drafts
        </Link>
        <Link href="/admin/products/import" className="mc-btn mc-btn--ghost">
          Back to import
        </Link>
        <Link href="/admin/products" className="mc-btn mc-btn--ghost">
          All products
        </Link>
      </div>
    </section>
  );
}
