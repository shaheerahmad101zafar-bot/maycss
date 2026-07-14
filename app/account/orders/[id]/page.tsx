import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOrderById, ORDER_STATUS_LABELS } from "@/lib/orders";
import { cx, formatPrice } from "@/lib/utils";
import OrderTimeline from "@/components/orders/OrderTimeline";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Order ${id} · Account · MayCSS` };
}

export default async function AccountOrderPage({ params }: Props) {
  const { id } = await params;
  const session = await auth();
  const order = await getOrderById(id);
  if (!order) notFound();

  const sessionEmail = session?.user?.email?.toLowerCase();
  if (!sessionEmail || order.email.toLowerCase() !== sessionEmail) {
    notFound();
  }

  return (
    <section className="mc-account__section">
      <header className="mc-account__header">
        <div>
          <p className="mc-admin__row-id" style={{ marginBottom: 4 }}>
            <Link
              href="/account/orders"
              style={{ color: "var(--mc-gray-600)" }}
            >
              ← My orders
            </Link>
          </p>
          <h1
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            Order {order.id}
            <span
              className={cx("mc-status-pill", `is-status-${order.status}`)}
              style={{ fontSize: "0.75rem" }}
            >
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </h1>
          <p>Placed {new Date(order.createdAt).toLocaleString()}</p>
        </div>
      </header>

      <div className="mc-order-detail">
        <section className="mc-order-detail__card">
          <h2 className="mc-order-detail__section-title">Timeline</h2>
          <OrderTimeline order={order} />
        </section>

        {order.tracking?.trackingNumber && (
          <section className="mc-order-detail__card">
            <h2 className="mc-order-detail__section-title">Tracking</h2>
            <dl className="mc-order-detail__kv">
              {order.tracking.carrier && (
                <div>
                  <dt>Carrier</dt>
                  <dd>{order.tracking.carrier}</dd>
                </div>
              )}
              <div>
                <dt>Tracking #</dt>
                <dd className="mc-admin__mono">
                  {order.tracking.trackingNumber}
                </dd>
              </div>
              {order.tracking.trackingUrl && (
                <div>
                  <dt>Link</dt>
                  <dd>
                    <a
                      href={order.tracking.trackingUrl}
                      target="_blank"
                      rel="noopener"
                    >
                      Track shipment &rarr;
                    </a>
                  </dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className="mc-order-detail__card">
          <h2 className="mc-order-detail__section-title">Items</h2>
          <table className="mc-admin__table">
            <thead>
              <tr>
                <th scope="col">Product</th>
                <th scope="col">Qty</th>
                <th scope="col">Line total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((i) => (
                <tr key={String(i.id)}>
                  <td>
                    <div className="mc-admin__row-product">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={i.image} alt="" />
                      <div>
                        <p className="mc-admin__row-name">{i.name}</p>
                        {i.brand && (
                          <p className="mc-admin__row-id">{i.brand}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td>{i.quantity}</td>
                  <td>{formatPrice(i.price * i.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <dl className="mc-order-detail__totals">
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(order.subtotal)}</dd>
            </div>
            <div>
              <dt>Shipping</dt>
              <dd>{formatPrice(order.shippingCost)}</dd>
            </div>
            <div>
              <dt>Tax</dt>
              <dd>{formatPrice(order.tax)}</dd>
            </div>
            <div className="is-total">
              <dt>Total</dt>
              <dd>{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </section>
  );
}
