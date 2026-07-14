import "server-only";

import type {
  PaymentGatewayInterface,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  RefundOutput,
  Result,
  StrategyContext,
  WebhookEvent,
} from "./types";
import { toErrorResult } from "../errors";

/**
 * GenericAPI strategy — the "no-code" universal REST adapter.
 *
 * This is the workhorse that fulfils the "add ANY gateway without changing
 * core code" promise. The admin doesn't ship a new class — they fill in
 * this strategy's fields via the settings UI:
 *
 *   • Checkout URL
 *   • Refund URL (optional)
 *   • Auth-header template: e.g. `Bearer {apiKey}` or `Basic {basicAuth}`
 *   • Amount multiplier: 100 for cents-based providers, 1 for whole units
 *   • Response path: JSON path where the transaction id lives (e.g. `data.id`)
 *   • Redirect path: JSON path where the hosted-checkout URL lives
 *
 * As long as the target gateway follows the "POST JSON → return { id, url }"
 * pattern, no code is required. For anything more exotic (custom auth,
 * signed requests, SOAP), implement a dedicated strategy in a new file.
 */

function renderTemplate(
  tpl: string,
  vars: Record<string, string>,
): string {
  return tpl.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? "");
}

/**
 * Walks a JSON path like "data.result.id" against an unknown value.
 * Returns undefined if any segment is missing.
 */
function readPath(value: unknown, path: string): string | undefined {
  if (!path) return undefined;
  const parts = path.split(".");
  let cur: unknown = value;
  for (const p of parts) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Record<string, unknown>)[p];
  }
  return typeof cur === "string" ? cur : cur == null ? undefined : String(cur);
}

function buildAuthHeader(ctx: StrategyContext): string {
  const template = ctx.credentials.authHeader || "Bearer {apiKey}";
  const basicAuth = Buffer.from(
    `${ctx.credentials.apiKey}:${ctx.credentials.secretKey ?? ""}`,
    "utf8",
  ).toString("base64");
  return renderTemplate(template, {
    apiKey: ctx.credentials.apiKey ?? "",
    secretKey: ctx.credentials.secretKey ?? "",
    merchantId: ctx.credentials.merchantId ?? "",
    basicAuth,
  });
}

export const genericApiStrategy: PaymentGatewayInterface = {
  id: "generic_api",
  label: "Generic REST API (no-code)",
  authType: "generic_api",
  apiKeyOnly: false,
  supportedCurrencies: ["usd", "eur", "gbp", "aed", "aud", "cad", "pkr"],

  fields: [
    {
      key: "checkoutUrl",
      label: "Checkout endpoint URL",
      type: "url",
      required: true,
      placeholder: "https://api.example.com/v1/payments",
      helper:
        "POST target for creating a payment. Body is JSON — see amountKey / currencyKey below.",
    },
    {
      key: "refundUrl",
      label: "Refund endpoint URL",
      type: "url",
      required: false,
      placeholder: "https://api.example.com/v1/refunds",
      helper: "Optional. Refunds disabled if left blank.",
    },
    {
      key: "authHeader",
      label: "Authorization header template",
      type: "text",
      required: true,
      placeholder: "Bearer {apiKey}",
      helper:
        "Placeholders: {apiKey}, {secretKey}, {merchantId}, {basicAuth}. Example: Bearer {apiKey} or Basic {basicAuth}.",
    },
    {
      key: "apiKey",
      label: "API Key",
      type: "text",
      required: true,
    },
    {
      key: "secretKey",
      label: "Secret Key",
      type: "password",
      required: false,
      helper: "Required only if your provider needs a second key.",
    },
    {
      key: "amountKey",
      label: "Request body key for amount",
      type: "text",
      required: true,
      placeholder: "amount",
    },
    {
      key: "amountMultiplier",
      label: "Amount multiplier",
      type: "select",
      required: true,
      options: [
        { label: "×100 (cents / fils)", value: "100" },
        { label: "×1 (whole units)", value: "1" },
      ],
    },
    {
      key: "currencyKey",
      label: "Request body key for currency",
      type: "text",
      required: true,
      placeholder: "currency",
    },
    {
      key: "transactionIdPath",
      label: "Response JSON path → transaction id",
      type: "text",
      required: true,
      placeholder: "id  |  data.transactionId",
    },
    {
      key: "redirectUrlPath",
      label: "Response JSON path → redirect url",
      type: "text",
      required: false,
      placeholder: "url  |  redirect_url  |  data.checkout_url",
      helper: "Leave blank for provider-hosted flows that don't redirect.",
    },
  ],

  isConfigured(ctx) {
    return Boolean(
      ctx.credentials.checkoutUrl &&
        ctx.credentials.apiKey &&
        ctx.credentials.authHeader &&
        ctx.credentials.amountKey &&
        ctx.credentials.currencyKey,
    );
  },

  async validate(ctx) {
    if (!this.isConfigured(ctx)) {
      return {
        ok: false,
        error:
          "Fill checkout URL, API key, auth-header template, amount + currency keys, and transaction-id path.",
      };
    }
    try {
      // A HEAD request usually tells us whether the endpoint is reachable +
      // whether auth is being accepted, without triggering a real charge.
      const res = await fetch(ctx.credentials.checkoutUrl, {
        method: "HEAD",
        headers: { Authorization: buildAuthHeader(ctx) },
        signal: AbortSignal.timeout(5_000),
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "Auth header rejected by the endpoint." };
      }
      if (res.status >= 500) {
        return {
          ok: false,
          error: `Endpoint returned ${res.status}. Try again later.`,
        };
      }
      return {
        ok: true,
        value: { mode: ctx.environment === "live" ? "live" : "test" },
      };
    } catch (err) {
      return toErrorResult(err, "generic_api");
    }
  },

  async processPayment(
    ctx,
    input,
  ): Promise<Result<ProcessPaymentOutput>> {
    try {
      const multiplier = Number(ctx.credentials.amountMultiplier || "100");
      const body: Record<string, unknown> = {
        [ctx.credentials.amountKey]: Math.round(input.amount * multiplier),
        [ctx.credentials.currencyKey]: input.currency.toUpperCase(),
        order_id: input.orderId,
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        customer_email: input.customer.email,
        customer_name: input.customer.name,
      };
      if (input.metadata) body.metadata = input.metadata;

      const res = await fetch(ctx.credentials.checkoutUrl, {
        method: "POST",
        headers: {
          Authorization: buildAuthHeader(ctx),
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        const raw = await res.text();
        return {
          ok: false,
          error: `Gateway rejected the payment (${res.status}): ${raw.slice(0, 200)}`,
          code: "provider_error",
        };
      }
      const data = (await res.json()) as unknown;
      const txId =
        readPath(data, ctx.credentials.transactionIdPath) ??
        `gen_${Date.now().toString(36)}`;
      const redirect = ctx.credentials.redirectUrlPath
        ? readPath(data, ctx.credentials.redirectUrlPath)
        : undefined;
      return {
        ok: true,
        value: {
          transactionId: txId,
          status: "pending",
          redirectUrl: redirect ?? input.successUrl,
        },
      };
    } catch (err) {
      return toErrorResult(err, "generic_api");
    }
  },

  async refund(ctx, input): Promise<Result<RefundOutput>> {
    if (!ctx.credentials.refundUrl) {
      return {
        ok: false,
        error: "Refund endpoint not configured for this gateway.",
        code: "refund_not_allowed",
      };
    }
    try {
      const res = await fetch(ctx.credentials.refundUrl, {
        method: "POST",
        headers: {
          Authorization: buildAuthHeader(ctx),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transaction_id: input.transactionId,
          amount:
            typeof input.amount === "number"
              ? Math.round(input.amount * Number(ctx.credentials.amountMultiplier || "100"))
              : undefined,
          reason: input.reason,
        }),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: `Refund failed (${res.status}).`,
          code: "provider_error",
        };
      }
      const data = (await res.json()) as unknown;
      const refundId = readPath(data, "id") ?? `gen_ref_${Date.now().toString(36)}`;
      return {
        ok: true,
        value: {
          refundId,
          refundedAmount: input.amount ?? 0,
        },
      };
    } catch (err) {
      return toErrorResult(err, "generic_api");
    }
  },

  async verifyWebhook(
    _ctx: StrategyContext,
    _payload: string,
    _signature: string,
  ): Promise<WebhookEvent | null> {
    // Generic strategy can't verify signatures — provider-specific.
    // Callers should treat webhooks from generic_api providers as unverified.
    return null;
  },
};

 
type _ = ProcessPaymentInput;
