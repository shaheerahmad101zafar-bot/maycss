/**
 * MayCSS — Order lifecycle types & constants (CLIENT-SAFE).
 */

import type { Product } from "./utils";

export type OrderItem = {
  id: Product["id"];
  name: string;
  brand?: string;
  image: string;
  price: number;
  quantity: number;
};

export type OrderStatus = "pending" | "processing" | "hold" | "completed";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "hold",
  "completed",
];

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  hold: "On Hold",
  completed: "Completed",
};

export const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  pending: ["processing", "hold", "completed"],
  processing: ["pending", "hold", "completed"],
  hold: ["pending", "processing", "completed"],
  completed: ["pending", "processing", "hold"],
};

export type OrderStatusEvent = {
  from: OrderStatus | null;
  to: OrderStatus;
  at: string;
  by: "admin" | "system" | "customer";
  note?: string;
};

export type OrderTracking = {
  carrier?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  estimatedDelivery?: string;
};

/**
 * Payment metadata attached to every order.
 *   - method: "card" — processed automatically by the MerchantAdapter.
 *   - method: "manual" — Zelle / Venmo / CashApp; requires admin review
 *     to verify funds arrived.
 */
export type OrderPayment = {
  method: "card" | "manual";
  methodId?: string;         // FK → ManualPaymentMethod.id
  methodName?: string;       // e.g. "Zelle"
  discountPercent?: number;
  discountAmount?: number;
};

export type Order = {
  id: string;
  createdAt: string;
  email: string;
  contact: { firstName: string; lastName: string };
  phone?: string;
  shipping: {
    address1: string;
    address2?: string;
    city: string;
    state: string;
    zip: string;
    country?: string;      // ISO 3166-1 alpha-2, e.g. "US", "AE"
  };
  items: OrderItem[];
  subtotal: number;
  shippingCost: number;
  tax: number;
  /** Order-level discount from coupons / campaigns — separate from payment-method discount. */
  couponCode?: string;
  discountAmount?: number;
  /** ISO 4217, lowercase. Default "usd". Keeps the order safe across FX changes. */
  currency?: string;
  total: number;
  status: OrderStatus;
  statusHistory: OrderStatusEvent[];
  tracking?: OrderTracking;
  paymentTransactionId?: string;
  payment?: OrderPayment;
};

export function transitionOrder(
  order: Order,
  toStatus: OrderStatus,
  by: OrderStatusEvent["by"],
  extras?: { note?: string; tracking?: OrderTracking },
): Order | null {
  if (!ORDER_STATUSES.includes(toStatus)) return null;
  if (order.status === toStatus && !extras?.tracking && !extras?.note) {
    return null;
  }
  const event: OrderStatusEvent = {
    from: order.status,
    to: toStatus,
    at: new Date().toISOString(),
    by,
    note: extras?.note,
  };
  return {
    ...order,
    status: toStatus,
    statusHistory: [...order.statusHistory, event],
    tracking: extras?.tracking ?? order.tracking,
  };
}

export function normalizeStatus(raw: unknown): OrderStatus {
  const s = String(raw ?? "pending").toLowerCase();
  if (s === "processing") return "processing";
  if (s === "hold" || s === "on_hold" || s === "on-hold") return "hold";
  if (
    s === "completed" ||
    s === "shipped" ||
    s === "delivered" ||
    s === "refunded"
  )
    return "completed";
  if (s === "cancelled" || s === "canceled") return "hold";
  return "pending";
}

/**
 * "Needs review" filter: manual payments that haven't been marked completed.
 * Admin uses this on /admin/orders?filter=review.
 */
export function needsReview(order: Order): boolean {
  return (
    order.payment?.method === "manual" &&
    (order.status === "pending" || order.status === "hold")
  );
}
