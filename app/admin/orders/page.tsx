import Link from "next/link";
import { getOrders, needsReview } from "@/lib/orders";
import { cx, formatPrice } from "@/lib/utils";
import InlineStatusDropdown from "@/components/admin/InlineStatusDropdown";

export const metadata = { title: "Orders · Admin · MayCSS" };

type Props = { searchParams: Promise<{ filter?: string }> };

export default async function AdminOrdersPage({ searchParams }: Props) {
  const { filter } = await searchParams;
  const allOrders = await getOrders();
  const reviewCount = allOrders.filter(needsReview).length;

  const orders =
    filter === "review" ? allOrders.filter(needsReview) : allOrders;

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <h1>Orders</h1>
          <p>
            {allOrders.length}{" "}
            {allOrders.length === 1 ? "order" : "orders"} placed to date. Change
            status directly from the dropdown — the customer is emailed and the
            tracking page updates instantly.
          </p>
        </div>
      </header>

      <div className="mc-admin__tabs" role="tablist">
        <Link
          href="/admin/orders"
          role="tab"
          aria-selected={filter !== "review"}
          className={cx(
            "mc-admin__tab",
            filter !== "review" && "is-active",
          )}
        >
          All Orders
          <span className="mc-admin__tab-count">{allOrders.length}</span>
        </Link>
        <Link
          href="/admin/orders?filter=review"
          role="tab"
          aria-selected={filter === "review"}
          className={cx(
            "mc-admin__tab",
            filter === "review" && "is-active",
            reviewCount > 0 && "has-alert",
          )}
        >
          Needs Review
          <span className="mc-admin__tab-count">{reviewCount}</span>
        </Link>
      </div>

      <div className="mc-admin__table-wrap">
        <table className="mc-admin__table mc-admin__table--orders">
          <thead>
            <tr>
              <th scope="col">Order</th>
              <th scope="col">Customer</th>
              <th scope="col">Contact</th>
              <th scope="col">Shipping address</th>
              <th scope="col">Payment</th>
              <th scope="col">Total</th>
              <th scope="col">Status</th>
              <th scope="col">Placed</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => {
              const p = o.payment ?? { method: "card" as const };
              const isManual = p.method === "manual";
              return (
                <tr key={o.id}>
                  <td className="mc-admin__mono">
                    <Link
                      href={`/admin/orders/${o.id}`}
                      className="mc-admin__link"
                    >
                      {o.id}
                    </Link>
                    {needsReview(o) && (
                      <span
                        className="mc-status-pill is-status-hold"
                        style={{ marginLeft: 6, fontSize: "0.62rem" }}
                      >
                        Review
                      </span>
                    )}
                  </td>
                  <td>
                    <p className="mc-admin__row-name" style={{ margin: 0 }}>
                      {o.contact.firstName} {o.contact.lastName}
                    </p>
                  </td>
                  <td>
                    <div className="mc-admin__stacked">
                      <a
                        href={`mailto:${o.email}`}
                        className="mc-admin__link"
                        title={o.email}
                      >
                        {o.email}
                      </a>
                      {o.phone ? (
                        <a
                          href={`tel:${o.phone}`}
                          className="mc-admin__stacked-sub"
                        >
                          {o.phone}
                        </a>
                      ) : (
                        <span className="mc-admin__stacked-sub is-muted">
                          No phone
                        </span>
                      )}
                    </div>
                  </td>
                  <td>
                    <div className="mc-admin__stacked">
                      <span>{o.shipping.address1}</span>
                      {o.shipping.address2 && (
                        <span className="mc-admin__stacked-sub">
                          {o.shipping.address2}
                        </span>
                      )}
                      <span className="mc-admin__stacked-sub">
                        {o.shipping.city}, {o.shipping.state} {o.shipping.zip}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="mc-admin__stacked">
                      <span>
                        {isManual ? p.methodName ?? "Manual" : "Card"}
                      </span>
                      {isManual && p.discountAmount ? (
                        <span className="mc-admin__stacked-sub">
                          {p.discountPercent}% off · -{formatPrice(p.discountAmount)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td>{formatPrice(o.total)}</td>
                  <td>
                    <InlineStatusDropdown orderId={o.id} current={o.status} />
                  </td>
                  <td>{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={8} className="mc-admin__empty-cell">
                  {filter === "review"
                    ? "No orders need review right now."
                    : "No orders yet. Place one via /checkout."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
