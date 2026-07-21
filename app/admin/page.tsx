import Link from "next/link";
import { getProducts } from "@/lib/data";
import { getOrders } from "@/lib/orders";
import { PageFactory } from "@/lib/pages";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Dashboard · Admin · MayCSS" };

export default async function AdminDashboardPage() {
  const [products, orders, homePage] = await Promise.all([
    getProducts({ fresh: true }),
    getOrders(),
    PageFactory.getBySlug("home"),
  ]);
  const revenue = orders.reduce((acc, o) => acc + o.total, 0);
  const unitsSold = orders.reduce(
    (acc, o) => acc + o.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your storefront.</p>
        </div>
        <div className="mc-admin__quick">
          <Link href="/admin/products/new" className="mc-btn mc-btn--primary">
            + New Product
          </Link>
        </div>
      </header>

      <div
        className="mc-admin__stat"
        style={{ marginBottom: 24, borderLeft: "4px solid var(--mc-gold, #b8956b)" }}
      >
        <p className="mc-admin__stat-label">Homepage content</p>
        <p className="mc-admin__hint" style={{ margin: "8px 0 12px" }}>
          Edit hero, banners, newsletter strip, store benefits bar (shipping,
          authenticity, etc.), and bottom text — all from the block editor.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link
            href={homePage ? `/admin/pages/${homePage.id}/edit` : "/admin/pages"}
            className="mc-btn mc-btn--primary"
          >
            {homePage ? "Edit Homepage →" : "Set up Homepage →"}
          </Link>
          <Link href="/" target="_blank" className="mc-btn mc-btn--ghost">
            View live →
          </Link>
        </div>
      </div>

      <div className="mc-admin__stats">
        <Link href="/admin/products" className="mc-admin__stat">
          <p className="mc-admin__stat-label">Products</p>
          <p className="mc-admin__stat-value">{products.length}</p>
          <span className="mc-admin__stat-cta">Manage &rarr;</span>
        </Link>
        <Link href="/admin/orders" className="mc-admin__stat">
          <p className="mc-admin__stat-label">Orders</p>
          <p className="mc-admin__stat-value">{orders.length}</p>
          <span className="mc-admin__stat-cta">View &rarr;</span>
        </Link>
        <div className="mc-admin__stat">
          <p className="mc-admin__stat-label">Revenue</p>
          <p className="mc-admin__stat-value is-accent">{formatPrice(revenue)}</p>
          <span className="mc-admin__stat-cta">{unitsSold} units sold</span>
        </div>
      </div>

      <div className="mc-admin__panel">
        <h2>Recent orders</h2>
        {orders.length === 0 ? (
          <p className="mc-admin__muted">
            No orders yet. Place a test order via{" "}
            <Link href="/checkout">/checkout</Link>.
          </p>
        ) : (
          <ul className="mc-admin__recent">
            {orders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <div>
                  <p className="mc-admin__mono">{o.id}</p>
                  <p className="mc-admin__muted">
                    {o.contact.firstName} {o.contact.lastName} &middot;{" "}
                    {new Date(o.createdAt).toLocaleString()}
                  </p>
                </div>
                <span>{formatPrice(o.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
