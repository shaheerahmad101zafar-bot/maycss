import Link from "next/link";
import { auth } from "@/auth";
import { getOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "Overview · Account · MayCSS" };

export default async function AccountOverviewPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allOrders = await getOrders();
  const myOrders = email
    ? allOrders.filter((o) => o.email.toLowerCase() === email)
    : [];

  const totalSpent = myOrders.reduce((acc, o) => acc + o.total, 0);
  const itemsBought = myOrders.reduce(
    (acc, o) => acc + o.items.reduce((n, i) => n + i.quantity, 0),
    0,
  );

  return (
    <section className="mc-account__section">
      <header className="mc-account__header">
        <div>
          <h1>Welcome{session?.user?.name ? `, ${session.user.name}` : ""}.</h1>
          <p>Your account at a glance.</p>
        </div>
      </header>

      <div className="mc-account__stats">
        <Link href="/account/orders" className="mc-admin__stat">
          <p className="mc-admin__stat-label">Orders</p>
          <p className="mc-admin__stat-value">{myOrders.length}</p>
          <span className="mc-admin__stat-cta">View history &rarr;</span>
        </Link>
        <div className="mc-admin__stat">
          <p className="mc-admin__stat-label">Total spent</p>
          <p className="mc-admin__stat-value is-accent">{formatPrice(totalSpent)}</p>
          <span className="mc-admin__stat-cta">{itemsBought} items</span>
        </div>
        <div className="mc-admin__stat">
          <p className="mc-admin__stat-label">Signed in as</p>
          <p className="mc-admin__stat-value" style={{ fontSize: "1.05rem" }}>
            {session?.user?.email ?? "—"}
          </p>
          <span className="mc-admin__stat-cta">
            {(session?.user as { image?: string } | undefined)?.image
              ? "OAuth provider"
              : "Session token"}
          </span>
        </div>
      </div>

      <div className="mc-admin__panel">
        <h2>Recent orders</h2>
        {myOrders.length === 0 ? (
          <p className="mc-admin__muted">
            You haven&apos;t placed any orders yet.{" "}
            <Link href="/shop">Start shopping</Link>.
          </p>
        ) : (
          <ul className="mc-admin__recent">
            {myOrders.slice(0, 5).map((o) => (
              <li key={o.id}>
                <div>
                  <p className="mc-admin__mono">{o.id}</p>
                  <p className="mc-admin__muted">
                    {new Date(o.createdAt).toLocaleString()} &middot;{" "}
                    {o.items.reduce((n, i) => n + i.quantity, 0)} items
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
