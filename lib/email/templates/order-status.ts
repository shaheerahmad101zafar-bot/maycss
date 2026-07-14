import "server-only";

import type { Order, OrderStatusEvent } from "@/lib/orders";
import { ORDER_STATUS_LABELS } from "@/lib/orders";
import { formatPrice } from "@/lib/utils";

export function renderOrderStatusEmail(
  order: Order,
  event: OrderStatusEvent,
): { subject: string; html: string; text: string } {
  const statusLabel = ORDER_STATUS_LABELS[event.to];
  const subject = `Your MayCSS order ${order.id} is now ${statusLabel}`;

  const trackingBlockText = order.tracking?.trackingNumber
    ? `\n\nTracking:\n  Carrier: ${order.tracking.carrier ?? "—"}\n  Number: ${order.tracking.trackingNumber}\n  ${
        order.tracking.trackingUrl ?? ""
      }`
    : "";

  const itemsText = order.items
    .map((i) => `  • ${i.name} × ${i.quantity} — ${formatPrice(i.price * i.quantity)}`)
    .join("\n");

  const text = `Hi ${order.contact.firstName},

Your order ${order.id} is now ${statusLabel}.
${event.note ? `\nNote from us: ${event.note}\n` : ""}
Order summary
${itemsText}

Subtotal:  ${formatPrice(order.subtotal)}
Shipping:  ${formatPrice(order.shippingCost)}
Tax:       ${formatPrice(order.tax)}
Total:     ${formatPrice(order.total)}
${trackingBlockText}

Track your order any time at:
  http://localhost:3000/track/${order.id}?email=${encodeURIComponent(order.email)}

Thanks for shopping with MayCSS.
`;

  const itemsHtml = order.items
    .map(
      (i) => `
        <tr>
          <td style="padding:8px 0;color:#111">${escapeHtml(i.name)} × ${i.quantity}</td>
          <td style="padding:8px 0;color:#111;text-align:right">${formatPrice(i.price * i.quantity)}</td>
        </tr>`,
    )
    .join("");

  const trackingHtml = order.tracking?.trackingNumber
    ? `
    <p style="margin:0 0 6px;font-size:12px;letter-spacing:.18em;color:#999;text-transform:uppercase">Tracking</p>
    <p style="margin:0 0 4px;color:#111">${escapeHtml(order.tracking.carrier ?? "—")} · <strong>${escapeHtml(order.tracking.trackingNumber)}</strong></p>
    ${order.tracking.trackingUrl ? `<p><a href="${order.tracking.trackingUrl}" style="color:#e21a2c">Track shipment →</a></p>` : ""}
  `
    : "";

  const html = `<!doctype html>
<html><body style="margin:0;background:#faf7f2;font-family:Helvetica,Arial,sans-serif">
  <table cellpadding="0" cellspacing="0" border="0" width="100%" style="padding:32px 16px">
    <tr><td>
      <table cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(0,0,0,.08)">
        <tr><td style="padding:26px 32px 8px">
          <p style="margin:0;font-size:12px;letter-spacing:.24em;color:#c8a75b;text-transform:uppercase">MayCSS</p>
          <h1 style="margin:6px 0 4px;font-family:Georgia,serif;font-size:24px;color:#111">Order ${escapeHtml(order.id)}</h1>
          <p style="margin:0;color:#555">Status: <strong style="color:#111">${statusLabel}</strong></p>
        </td></tr>
        ${event.note ? `<tr><td style="padding:12px 32px"><p style="background:#faf7f2;padding:14px;border-radius:8px;margin:0;color:#333">${escapeHtml(event.note)}</p></td></tr>` : ""}
        <tr><td style="padding:12px 32px">
          <p style="margin:0 0 6px;font-size:12px;letter-spacing:.18em;color:#999;text-transform:uppercase">Items</p>
          <table cellpadding="0" cellspacing="0" border="0" width="100%">${itemsHtml}</table>
        </td></tr>
        <tr><td style="padding:12px 32px">
          <table cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px dashed #dcdcdc;padding-top:10px">
            <tr><td style="color:#555">Subtotal</td><td style="text-align:right;color:#111">${formatPrice(order.subtotal)}</td></tr>
            <tr><td style="color:#555">Shipping</td><td style="text-align:right;color:#111">${formatPrice(order.shippingCost)}</td></tr>
            <tr><td style="color:#555">Tax</td><td style="text-align:right;color:#111">${formatPrice(order.tax)}</td></tr>
            <tr><td style="color:#111;font-weight:700;padding-top:8px">Total</td><td style="text-align:right;color:#111;font-weight:700;padding-top:8px">${formatPrice(order.total)}</td></tr>
          </table>
        </td></tr>
        ${trackingHtml ? `<tr><td style="padding:12px 32px">${trackingHtml}</td></tr>` : ""}
        <tr><td style="padding:20px 32px 32px;text-align:center">
          <a href="http://localhost:3000/track/${order.id}?email=${encodeURIComponent(order.email)}" style="display:inline-block;background:#111;color:#fff;padding:12px 22px;text-decoration:none;border-radius:4px;font-size:12px;letter-spacing:.14em;text-transform:uppercase">Track your order</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
