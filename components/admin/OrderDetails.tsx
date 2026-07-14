import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/orders";
import OrderTimeline from "@/components/orders/OrderTimeline";
import OrderStatusForm from "./OrderStatusForm";

interface Props {
  order: Order;
}

export default function OrderDetails({ order }: Props) {
  const units = order.items.reduce((n, i) => n + i.quantity, 0);
  const p = order.payment ?? { method: "card" as const };
  const isManual = p.method === "manual";

  return (
    <div className="mc-order-detail">
      <section className="mc-order-detail__card">
        <h2 className="mc-order-detail__section-title">Customer</h2>
        <dl className="mc-order-detail__kv">
          <div>
            <dt>Name</dt>
            <dd>
              {order.contact.firstName} {order.contact.lastName}
            </dd>
          </div>
          <div>
            <dt>Email</dt>
            <dd>
              <a href={`mailto:${order.email}`}>{order.email}</a>
            </dd>
          </div>
          <div>
            <dt>Phone</dt>
            <dd>
              {order.phone ? (
                <a href={`tel:${order.phone}`}>{order.phone}</a>
              ) : (
                <span className="mc-admin__muted">Not provided</span>
              )}
            </dd>
          </div>
          <div>
            <dt>Shipping address</dt>
            <dd>
              {order.shipping.address1}
              {order.shipping.address2 && <>, {order.shipping.address2}</>}
              <br />
              {order.shipping.city}, {order.shipping.state} {order.shipping.zip}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mc-order-detail__card">
        <h2 className="mc-order-detail__section-title">Payment</h2>
        <dl className="mc-order-detail__kv">
          <div>
            <dt>Method</dt>
            <dd>
              {isManual ? (
                <strong>{p.methodName ?? "Manual"}</strong>
              ) : (
                <>Card (auto)</>
              )}
            </dd>
          </div>
          {isManual && (
            <>
              <div>
                <dt>Discount</dt>
                <dd>
                  {p.discountPercent ?? 0}% (-{formatPrice(p.discountAmount ?? 0)})
                </dd>
              </div>
              <div>
                <dt>Verification</dt>
                <dd>
                  {order.status === "completed" ? (
                    <span className="mc-status-pill is-status-completed">
                      Verified
                    </span>
                  ) : (
                    <span className="mc-status-pill is-status-hold">
                      Needs review
                    </span>
                  )}
                </dd>
              </div>
            </>
          )}
          {order.paymentTransactionId && (
            <div>
              <dt>Transaction id</dt>
              <dd className="mc-admin__mono">{order.paymentTransactionId}</dd>
            </div>
          )}
        </dl>
      </section>

      <section className="mc-order-detail__card">
        <h2 className="mc-order-detail__section-title">Change status</h2>
        <OrderStatusForm order={order} />
      </section>

      <section className="mc-order-detail__card">
        <h2 className="mc-order-detail__section-title">
          Items ({units} {units === 1 ? "unit" : "units"})
        </h2>
        <table className="mc-admin__table">
          <thead>
            <tr>
              <th scope="col">Product</th>
              <th scope="col">Qty</th>
              <th scope="col">Unit</th>
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
                      {i.brand && <p className="mc-admin__row-id">{i.brand}</p>}
                    </div>
                  </div>
                </td>
                <td>{i.quantity}</td>
                <td>{formatPrice(i.price)}</td>
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
          {isManual && (p.discountAmount ?? 0) > 0 && (
            <div>
              <dt>{p.methodName} discount</dt>
              <dd>-{formatPrice(p.discountAmount ?? 0)}</dd>
            </div>
          )}
          <div className="is-total">
            <dt>Total</dt>
            <dd>{formatPrice(order.total)}</dd>
          </div>
        </dl>
      </section>

      <section className="mc-order-detail__card">
        <h2 className="mc-order-detail__section-title">Timeline</h2>
        <OrderTimeline order={order} />
      </section>
    </div>
  );
}
