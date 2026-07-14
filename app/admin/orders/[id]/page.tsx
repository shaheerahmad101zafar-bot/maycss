import { notFound } from "next/navigation";
import Link from "next/link";
import OrderDetails from "@/components/admin/OrderDetails";
import { getOrderById, ORDER_STATUS_LABELS } from "@/lib/orders";
import { cx } from "@/lib/utils";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  return { title: `Order ${id} · Admin · MayCSS` };
}

export default async function AdminOrderPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <section className="mc-admin__section">
      <header className="mc-admin__header">
        <div>
          <p className="mc-admin__row-id" style={{ marginBottom: 4 }}>
            <Link href="/admin/orders" style={{ color: "var(--mc-gray-600)" }}>
              ← All orders
            </Link>
          </p>
          <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {order.id}
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

      <OrderDetails order={order} />
    </section>
  );
}
