import Link from "next/link";
import { auth } from "@/auth";
import { getOrders } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export const metadata = { title: "My Orders · Account · MayCSS" };

export default async function AccountOrdersPage() {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  const allOrders = await getOrders();
  const orders = email
    ? allOrders.filter((o) => o.email.toLowerCase() === email)
    : [];

  return (
    <section className="mc-account__section">
      <header className="mc-account__header">
        <div>
          <h1>My orders</h1>
          <p>
            {orders.length}{" "}
            {orders.length === 1 ? "order" : "orders"} placed on this account.
          </p>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="mc-admin__panel">
          <p className="mc-admin__muted">
            You haven&apos;t placed any orders yet.{" "}
            <Link href="/shop">Start shopping</Link>.
          </p>
        </div>
      ) : (
        <div className="mc-admin__table-wrap">
          <table className="mc-admin__table">
            <thead>
              <tr>
                <th scope="col">Order</th>
                <th scope="col">Placed</th>
                <th scope="col">Items</th>
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="mc-admin__mono">{o.id}</td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                  <td>
                    <div className="mc-account__items-preview">
                      {o.items.slice(0, 3).map((i) => (
                        /* eslint-disable-next-line @next/next/no-img-element */
                        <img
                          key={String(i.id)}
                          src={i.image}
                          alt={i.name}
                          title={`${i.name} × ${i.quantity}`}
                        />
                      ))}
                      {o.items.length > 3 && (
                        <span>+{o.items.length - 3}</span>
                      )}
                    </div>
                  </td>
                  <td>{formatPrice(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
