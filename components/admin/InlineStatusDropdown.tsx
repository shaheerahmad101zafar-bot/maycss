"use client";

import { useState, useTransition } from "react";
import {
  inlineUpdateOrderStatusAction,
} from "@/app/admin/actions";
import {
  ORDER_STATUSES,
  ORDER_STATUS_LABELS,
  type OrderStatus,
} from "@/lib/orders-types";
import { cx } from "@/lib/utils";

interface Props {
  orderId: string;
  current: OrderStatus;
}

export default function InlineStatusDropdown({ orderId, current }: Props) {
  const [status, setStatus] = useState<OrderStatus>(current);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<
    { tone: "idle" } | { tone: "ok" } | { tone: "error"; msg: string }
  >({ tone: "idle" });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value as OrderStatus;
    const previous = status;
    setStatus(next);
    setState({ tone: "idle" });
    startTransition(async () => {
      const res = await inlineUpdateOrderStatusAction(orderId, next);
      if (res.ok) {
        setState({ tone: "ok" });
        window.setTimeout(() => setState({ tone: "idle" }), 1600);
      } else {
        setStatus(previous);
        setState({ tone: "error", msg: res.error });
      }
    });
  };

  return (
    <div className="mc-inline-status">
      <label className="mc-inline-status__label" htmlFor={`status-${orderId}`}>
        <span className="mc-visually-hidden">Status for order {orderId}</span>
      </label>
      <select
        id={`status-${orderId}`}
        className={cx(
          "mc-inline-status__select",
          `is-status-${status}`,
          pending && "is-pending",
        )}
        value={status}
        onChange={handleChange}
        disabled={pending}
        aria-label={`Change status for order ${orderId}`}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {ORDER_STATUS_LABELS[s]}
          </option>
        ))}
      </select>
      {pending && (
        <span className="mc-inline-status__hint" role="status">
          Saving…
        </span>
      )}
      {state.tone === "ok" && !pending && (
        <span className="mc-inline-status__hint is-ok" role="status">
          Saved ✓
        </span>
      )}
      {state.tone === "error" && (
        <span className="mc-inline-status__hint is-error" role="alert">
          {state.msg}
        </span>
      )}
    </div>
  );
}
