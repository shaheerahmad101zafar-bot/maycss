"use server";

import { revalidatePath } from "next/cache";
import {
  saveOrder,
  replaceOrder,
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
import {
  convertPrice,
  normalizeCurrency,
  type CurrencyCode,
} from "@/lib/currency";
import { PaymentEngine } from "@/lib/payments/engine";
import { getSiteOrigin } from "@/lib/site-url";

/* -------------------------------------------------------------------------- */
/*  Coupon table                                                              */
/* -------------------------------------------------------------------------- */

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
  | { ok: true; orderId: string; redirectUrl?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

/* -------------------------------------------------------------------------- */
/*  Server action                                                             */
/* -------------------------------------------------------------------------- */

export async function placeOrderAction(input: unknown): Promise<PlaceOrderResult> {
  const parsed = placeOrderSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Please review the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }
  const data = parsed.data;

  const [cfg, settings] = await Promise.all([getAppConfig(), getSettings()]);
  // Storefront + gateway charge are always USD end-to-end.
  const storeCurrency = normalizeCurrency("usd");
  const chargeCurrency = normalizeCurrency("usd");
  const storeName = cfg.siteName?.trim() || "MAYCSS";

  const subtotal = data.items.reduce(
    (acc, i) => acc + i.price * i.quantity,
    0,
  );
  const shippingCost = subtotal >= 75 ? 0 : 8.95;
  const tax = estimateTax(subtotal);

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

  let payment: OrderPayment = { method: "card" };
  let methodDiscount = 0;
  if (data.payment.method === "manual") {
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
        : "Order placed — awaiting card payment.",
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
    currency: storeCurrency,
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

  // Card path: create a real payment intent with the configured gateway
  // (Ziina / Stripe / PayPal / generic). Never touch raw card numbers here —
  // the customer is redirected to the provider's hosted checkout.
  if (payment.method === "card") {
    if (!settings.payments.enabled) {
      return {
        ok: false,
        error:
          "Card payments are not enabled. Ask the store admin to enable a gateway under Settings → Payments.",
      };
    }

    const ready = await PaymentEngine.isReady();
    if (!ready) {
      return {
        ok: false,
        error:
          "Payment gateway is not configured correctly. Check the API key in Admin → Settings → Payments.",
      };
    }

    const chargeAmount = toChargeAmount(total, storeCurrency, chargeCurrency);
    const origin = getSiteOrigin();
    const successPath =
      settings.payments.successRedirectPath?.trim() ||
      `/track/${order.id}?email=${encodeURIComponent(order.email)}&paid=1`;
    const successUrl = successPath.startsWith("http")
      ? successPath
      : `${origin}${successPath.startsWith("/") ? "" : "/"}${successPath}`;
    const cancelUrl = `${origin}/checkout?cancelled=1&order=${encodeURIComponent(order.id)}`;

    const pay = await PaymentEngine.processPayment({
      orderId: order.id,
      amount: chargeAmount,
      currency: "usd",
      customer: {
        name: `${order.contact.firstName} ${order.contact.lastName}`.trim(),
        email: order.email,
        phone: order.phone,
      },
      items: order.items.map((i) => ({
        name: i.name,
        quantity: i.quantity,
        price: toChargeAmount(i.price, storeCurrency, chargeCurrency),
      })),
      successUrl,
      cancelUrl,
      metadata: {
        order_id: order.id,
        store_currency: "usd",
        charge_currency: "usd",
        hosted_message: `${storeName} order ${order.id}`,
      },
    });

    if (!pay.ok) {
      console.error("[checkout] payment failed", pay.error, pay.code);
      try {
        await replaceOrder({
          ...order,
          status: "hold",
          statusHistory: [
            ...order.statusHistory,
            {
              from: "pending",
              to: "hold",
              at: new Date().toISOString(),
              by: "system",
              note: `Payment failed: ${pay.error}`,
            },
          ],
        });
      } catch (err) {
        console.warn("[checkout] could not mark order hold", err);
      }
      return {
        ok: false,
        error:
          pay.error ||
          "Payment could not be started. Please try again or use another method.",
      };
    }

    try {
      await replaceOrder({
        ...order,
        paymentTransactionId: pay.value.transactionId,
        statusHistory: [
          ...order.statusHistory,
          {
            from: "pending",
            to: "pending",
            at: new Date().toISOString(),
            by: "system",
            note: `Payment session created (${pay.value.transactionId}). Status: ${pay.value.status}.`,
          },
        ],
      });
    } catch (err) {
      console.warn("[checkout] could not save transaction id", err);
    }

    // Don't email "order placed" until payment succeeds for card — customer
    // may abandon the hosted checkout. Manual payments still get a receipt.
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    revalidatePath("/account/orders");

    if (!pay.value.redirectUrl) {
      return {
        ok: false,
        error:
          "Payment gateway did not return a checkout URL. Check provider settings / API response.",
      };
    }

    return {
      ok: true,
      orderId: order.id,
      redirectUrl: pay.value.redirectUrl,
    };
  }

  // Manual payment — confirm immediately, await admin review.
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

function toChargeAmount(
  amount: number,
  from: CurrencyCode,
  to: CurrencyCode,
): number {
  if (from === to) return amount;
  return convertPrice(amount, from, to);
}
