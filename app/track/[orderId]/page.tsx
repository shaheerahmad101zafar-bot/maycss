import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderById, ORDER_STATUS_LABELS } from "@/lib/orders";
import { cx, formatPrice } from "@/lib/utils";
import OrderTimeline from "@/components/orders/OrderTimeline";

type Props = {
  params: Promise<{ orderId: string }>;
  searchParams: Promise<{ email?: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { orderId } = await params;
  return {
    title: `Track ${orderId} · MayCSS`,
    robots: { index: false, follow: false },
  };
}

/**
 * Public tracking page. Requires the customer's email in the query
 * (case-insensitive match). This is a lightweight verification — enough
 * so a URL alone can't leak someone else's order.
 */
export default async function TrackOrderPage({ params, searchParams }: Props) {
  const { orderId } = await params;
  const { email } = await searchParams;
  const order = await getOrderById(orderId);
  if (!order) notFound();
  if (!email || order.email.toLowerCase() !== email.toLowerCase()) {
    return (
      <section className="mc-track">
        <div className="mc-container mc-track__lookup">
          <p className="mc-page__eyebrow">Track your order</p>
          <h1 className="mc-page__title">Verify your email</h1>
          <p className="mc-page__hero">
            To view this order, enter the email address you used at checkout.
          </p>
          <form className="mc-signin__form" method="get" action="">
            <div className="mc-field">
              <label htmlFor="email">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                placeholder="you@example.com"
              />
            </div>
            <button
              type="submit"
              className="mc-btn mc-btn--primary mc-btn--block"
            >
              Show order status
            </button>
          </form>
        </div>
      </section>
    );
  }

  return (
    <section className="mc-track">
      <header className="mc-page__header">
        <p className="mc-page__eyebrow">Order tracking</p>
        <h1
          className="mc-page__title"
          style={{ display: "flex", justifyContent: "center", gap: 12, alignItems: "center" }}
        >
          {order.id}
          <span className={cx("mc-status-pill", `is-status-${order.status}`)}>
            {ORDER_STATUS_LABELS[order.status]}
          </span>
        </h1>
        <p className="mc-page__hero">
          Hi {order.contact.firstName} — here&apos;s the latest on your order.
        </p>
      </header>

      <div className="mc-container mc-track__body">
        {order.tracking?.trackingNumber && (
          <div className="mc-order-detail__card">
            <h2 className="mc-order-detail__section-title">Tracking</h2>
            <dl className="mc-order-detail__kv">
              {order.tracking.carrier && (
                <div>
                  <dt>Carrier</dt>
                  <dd>{order.tracking.carrier}</dd>
                </div>
              )}
              <div>
                <dt>Tracking number</dt>
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
          </div>
        )}

        <div className="mc-order-detail__card">
          <h2 className="mc-order-detail__section-title">Timeline</h2>
          <OrderTimeline order={order} />
        </div>

        <div className="mc-order-detail__card">
          <h2 className="mc-order-detail__section-title">Order summary</h2>
          <ul className="mc-drawer__list" style={{ marginBottom: 12 }}>
            {order.items.map((i) => (
              <li key={String(i.id)} className="mc-drawer__item">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img className="mc-drawer__item-img" src={i.image} alt="" />
                <div className="mc-drawer__item-info">
                  {i.brand && (
                    <span className="mc-drawer__item-brand">{i.brand}</span>
                  )}
                  <p className="mc-drawer__item-name">{i.name}</p>
                  <p className="mc-drawer__item-price">
                    {i.quantity} × {formatPrice(i.price)}
                  </p>
                </div>
                <div className="mc-drawer__item-total">
                  {formatPrice(i.price * i.quantity)}
                </div>
              </li>
            ))}
          </ul>
          <p style={{ textAlign: "center" }}>
            Total paid: <strong>{formatPrice(order.total)}</strong>
          </p>
        </div>

        <p style={{ textAlign: "center", marginTop: 24 }}>
          <Link href="/" className="mc-btn mc-btn--ghost">
            Continue shopping
          </Link>
        </p>
      </div>
    </section>
  );
}
