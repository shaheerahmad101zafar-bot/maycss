"use server";

import { revalidatePath } from "next/cache";
import {
  saveOrder,
  type Order,
  type OrderPayment,
  type OrderStatusEvent,
} from "@/lib/orders";
import { estimateTax } from "@/lib/utils";
import { getEmailAdapter } from "@/lib/email";
import { renderOrderStatusEmail } from "@/lib/email/templates/order-status";
import { getSettings } from "@/lib/settings";
import { getAppConfig } from "@/lib/app-config";
import { placeOrderSchema, zodFieldErrors } from "@/lib/validation/schemas";
import { normalizeCurrency } from "@/lib/currency";

/* -------------------------------------------------------------------------- */
/*  Coupon table                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Sample in-memory coupon registry. In production, back this with a database
 * so campaign managers can add/edit codes without a redeploy. All logic below
 * is coupon-shape-agnostic — swap the lookup and everything downstream
 * continues to work.
 */
type Coupon =
  | { code: string; type: "percent"; value: number; minSubtotal?: number }
  | { code: string; type: "fixed"; value: number; minSubtotal?: number };

const COUPONS: Coupon[] = [
  { code: "WELCOME10", type: "percent", value: 10 },
  { code: "SAVE20", type: "percent", value: 20, minSubtotal: 100 },
  { code: "FLAT25", type: "fixed", value: 25, minSubtotal: 150 },
];

function findCoupon(code: string): Coupon | undefined {
  const norm = code.trim().toUpperCase();
  if (!norm) return undefined;
  return COUPONS.find((c) => c.code === norm);
}

function applyCoupon(subtotal: number, coupon: Coupon): number {
  if (coupon.minSubtotal && subtotal < coupon.minSubtotal) return 0;
  if (coupon.type === "percent") {
    return Math.round(((subtotal * coupon.value) / 100) * 100) / 100;
  }
  return Math.min(subtotal, coupon.value);
}

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

export type { PlaceOrderInput } from "@/lib/validation/schemas";

export type PlaceOrderResult =
  | { ok: true; orderId: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/* -------------------------------------------------------------------------- */
/*  Server action                                                             */
/* -------------------------------------------------------------------------- */

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  // 1) Zod validation — one call replaces the whole required-fields loop.
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  // 2) Compute money in the store's base currency.
  const cfg = await getAppConfig();
  const currency = normalizeCurrency(cfg.currency);

  const subtotal = data.items.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0,
  );
  const shippingCost = subtotal >= 75 ? 0 : 8.95;
  const tax = estimateTax(subtotal);

  // 3) Order-level coupon discount (independent from payment-method discount).
  let couponDiscount = 0;
  let couponCode: string | undefined;
  if (data.couponCode) {
    const coupon = findCoupon(data.couponCode);
    if (!coupon) {
      return {
        ok: false,
        error: `Coupon "${data.couponCode}" is not valid.`,
      };
    }
    if (coupon.minSubtotal && subtotal < coupon.minSubtotal) {
      return {
        ok: false,
        error: `${coupon.code} requires a subtotal of at least ${coupon.minSubtotal}.`,
      };
    }
    couponDiscount = applyCoupon(subtotal, coupon);
    couponCode = coupon.code;
  }

  const preTotal = subtotal + shippingCost + tax - couponDiscount;

  // 4) Resolve manual method server-side (never trust the client's discount).
  let payment: OrderPayment = { method: "card" };
  let methodDiscount = 0;
  if (data.payment.method === "manual") {
    const settings = await getSettings();
    const method = settings.payments.manualMethods.find(
      (m) => m.id === data.payment.methodId && m.enabled,
    );
    if (!method) {
      return {
        ok: false,
        error: "Selected payment method is no longer available.",
      };
    }
    const pct = Math.max(0, Math.min(100, method.discountPercent));
    methodDiscount = Math.round(((preTotal * pct) / 100) * 100) / 100;
    payment = {
      method: "manual",
      methodId: method.id,
      methodName: method.name,
      discountPercent: pct,
      discountAmount: methodDiscount,
    };
  }

  const total = Math.max(
    0,
    Math.round((preTotal - methodDiscount) * 100) / 100,
  );

  const now = new Date().toISOString();
  const initialEvent: OrderStatusEvent = {
    from: null,
    to: "pending",
    at: now,
    by: "customer",
    note:
      payment.method === "manual"
        ? `Order placed via ${payment.methodName}. Awaiting funds verification.`
        : "Order placed.",
  };

  const order: Order = {
    id: `MC-${Date.now().toString(36).toUpperCase()}`,
    createdAt: now,
    email: data.email.trim(),
    contact: {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
    },
    phone: data.phone?.trim() || undefined,
    shipping: {
      address1: data.address1.trim(),
      address2: data.address2?.trim() || undefined,
      city: data.city.trim(),
      state: data.state.trim(),
      zip: data.zip.trim(),
    },
    items: data.items.map((i) => ({
      id: i.id as Order["items"][number]["id"],
      name: i.name,
      brand: i.brand,
      image: i.image,
      price: i.price,
      quantity: i.quantity,
    })),
    subtotal,
    shippingCost,
    tax,
    couponCode,
    discountAmount: couponDiscount || undefined,
    currency,
    total,
    status: "pending",
    statusHistory: [initialEvent],
    payment,
  };

  try {
    await saveOrder(order);
  } catch (err) {
    console.error("saveOrder failed", err);
    return { ok: false, error: "We couldn't save your order. Please retry." };
  }

  try {
    const emailer = getEmailAdapter();
    const tpl = renderOrderStatusEmail(order, initialEvent);
    const res = await emailer.send({ to: order.email, ...tpl });
    if (!res.ok) console.warn("[order-receipt email]", res.error);
  } catch (err) {
    console.warn("[order-receipt exception]", err);
  }

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/account/orders");
  return { ok: true, orderId: order.id };
}
