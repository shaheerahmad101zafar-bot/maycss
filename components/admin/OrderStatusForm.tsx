"use client";

import { useActionState, useMemo, useState } from "react";
import {
  updateOrderStatusAction,
  type OrderStatusFormState,
} from "@/app/admin/actions";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type Order,
  type OrderStatus,
} from "@/lib/orders-types";
import { cx } from "@/lib/utils";

const initial: OrderStatusFormState = { ok: true, message: "" };

interface Props {
  order: Order;
}

export default function OrderStatusForm({ order }: Props) {
  const [state, formAction, pending] = useActionState(
    updateOrderStatusAction,
    initial,
  );
  const [toStatus, setToStatus] = useState<OrderStatus>(order.status);

  const showTracking = toStatus === "processing" || toStatus === "completed";

  const banner = useMemo(() => {
    if (state.ok && state.message) {
      return { tone: "ok" as const, text: state.message };
    }
    if (!state.ok) return { tone: "error" as const, text: state.error };
    return null;
  }, [state]);

  return (
    <form action={formAction} className="mc-order-status">
      <input type="hidden" name="orderId" value={order.id} />

      {banner && (
        <p
          className={cx(
            "mc-admin__banner",
            banner.tone === "error" && "is-error",
          )}
          role={banner.tone === "error" ? "alert" : "status"}
        >
          {banner.text}
        </p>
      )}

      <div className="mc-admin__form-grid">
        <div className="mc-field">
          <label>Current status</label>
          <p className="mc-order-status__current">
            <span className={cx("mc-status-pill", `is-status-${order.status}`)}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
          </p>
        </div>

        <div className="mc-field">
          <label htmlFor="toStatus">Update to</label>
          <select
            id="toStatus"
            name="toStatus"
            value={toStatus}
            onChange={(e) => setToStatus(e.target.value as OrderStatus)}
            required
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {ORDER_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="mc-field mc-field--full">
          <label htmlFor="note">Internal note (included in customer email)</label>
          <textarea
            id="note"
            name="note"
            rows={3}
            placeholder="Optional — will be included in the customer's status-change email."
          />
        </div>

        {showTracking && (
          <>
            <div className="mc-field">
              <label htmlFor="trackingCarrier">Carrier</label>
              <input
                id="trackingCarrier"
                name="trackingCarrier"
                defaultValue={order.tracking?.carrier}
                placeholder="UPS, FedEx, DHL…"
              />
            </div>
            <div className="mc-field">
              <label htmlFor="trackingNumber">Tracking number</label>
              <input
                id="trackingNumber"
                name="trackingNumber"
                defaultValue={order.tracking?.trackingNumber}
                placeholder="1Z…"
              />
            </div>
            <div className="mc-field mc-field--full">
              <label htmlFor="trackingUrl">Tracking URL</label>
              <input
                id="trackingUrl"
                name="trackingUrl"
                type="url"
                defaultValue={order.tracking?.trackingUrl}
                placeholder="https://…"
              />
            </div>
          </>
        )}
      </div>

      <div className="mc-admin__form-actions">
        <button
          type="submit"
          className={cx("mc-btn mc-btn--primary", pending && "is-loading")}
          disabled={pending}
        >
          {pending ? "Updating…" : "Update Status"}
        </button>
      </div>
    </form>
  );
}
