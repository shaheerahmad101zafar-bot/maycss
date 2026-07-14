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
import { PaymentError, toErrorResult } from "../errors";

/**
 * PayPal strategy — canonical `authType: "oauth"` implementation.
 *
 * PayPal uses OAuth 2.0 client-credentials: exchange { clientId, clientSecret }
 * for a short-lived bearer token, then attach it to every REST call. This
 * strategy demonstrates the pattern for any future OAuth-based provider
 * (Adyen, Square, Yoco). Bearer tokens are cached in memory for their TTL.
 */

type TokenCache = { token: string; expiresAt: number };
const tokenCache = new Map<string, TokenCache>();

async function getAccessToken(ctx: StrategyContext): Promise<string> {
  const baseUrl =
    ctx.environment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com";
  const cacheKey = `${baseUrl}:${ctx.credentials.clientId}`;
  const cached = tokenCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now() + 30_000) {
    return cached.token;
  }

  const basic = Buffer.from(
    `${ctx.credentials.clientId}:${ctx.credentials.clientSecret}`,
    "utf8",
  ).toString("base64");

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(10_000),
  });
  if (!res.ok) {
    throw new PaymentError(
      "invalid_credentials",
      `PayPal OAuth rejected the client credentials (${res.status}).`,
      { providerId: "paypal", httpStatus: res.status },
    );
  }
  const data = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };
  tokenCache.set(cacheKey, {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  });
  return data.access_token;
}

export const paypalStrategy: PaymentGatewayInterface = {
  id: "paypal",
  label: "PayPal",
  authType: "oauth",
  apiKeyOnly: false,
  supportedCurrencies: ["usd", "eur", "gbp", "aud", "cad", "aed"],

  fields: [
    {
      key: "clientId",
      label: "PayPal Client ID",
      type: "text",
      required: true,
      placeholder: "AXY…",
      helper: "From the PayPal Developer Dashboard → Apps.",
    },
    {
      key: "clientSecret",
      label: "PayPal Client Secret",
      type: "password",
      required: true,
      placeholder: "EN…",
    },
    {
      key: "webhookId",
      label: "Webhook ID",
      type: "text",
      required: false,
      placeholder: "1HG…",
      helper:
        "Optional. Only set if you subscribe to PayPal webhooks — used for HMAC verification.",
    },
  ],

  isConfigured(ctx) {
    return Boolean(ctx.credentials.clientId && ctx.credentials.clientSecret);
  },

  async validate(ctx) {
    if (!this.isConfigured(ctx)) {
      return {
        ok: false,
        error: "PayPal Client ID + Secret are both required.",
      };
    }
    try {
      await getAccessToken(ctx);
      return {
        ok: true,
        value: { mode: ctx.environment === "live" ? "live" : "test" },
      };
    } catch (err) {
      return toErrorResult(err, "paypal");
    }
  },

  async processPayment(
    ctx,
    input,
  ): Promise<Result<ProcessPaymentOutput>> {
    try {
      const token = await getAccessToken(ctx);
      const baseUrl =
        ctx.environment === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";

      const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          intent: "CAPTURE",
          purchase_units: [
            {
              reference_id: input.orderId,
              amount: {
                currency_code: input.currency.toUpperCase(),
                value: input.amount.toFixed(2),
              },
            },
          ],
          application_context: {
            return_url: input.successUrl,
            cancel_url: input.cancelUrl,
            brand_name: input.metadata?.storeName ?? "Store",
            user_action: "PAY_NOW",
          },
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: `PayPal rejected the order (${res.status}).`,
          code: "provider_error",
        };
      }
      const data = (await res.json()) as {
        id: string;
        links: Array<{ href: string; rel: string }>;
      };
      const approve = data.links.find((l) => l.rel === "approve")?.href;
      return {
        ok: true,
        value: {
          transactionId: data.id,
          status: "pending",
          redirectUrl: approve ?? input.successUrl,
        },
      };
    } catch (err) {
      return toErrorResult(err, "paypal");
    }
  },

  async refund(ctx, input): Promise<Result<RefundOutput>> {
    try {
      const token = await getAccessToken(ctx);
      const baseUrl =
        ctx.environment === "live"
          ? "https://api-m.paypal.com"
          : "https://api-m.sandbox.paypal.com";

      const body =
        typeof input.amount === "number"
          ? {
              amount: {
                value: input.amount.toFixed(2),
                currency_code: (ctx.currency ?? "usd").toUpperCase(),
              },
            }
          : {};

      const res = await fetch(
        `${baseUrl}/v2/payments/captures/${encodeURIComponent(input.transactionId)}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(body),
        },
      );
      if (!res.ok) {
        return {
          ok: false,
          error: `PayPal refund failed (${res.status}).`,
          code: "refund_not_allowed",
        };
      }
      const data = (await res.json()) as {
        id: string;
        amount: { value: string };
      };
      return {
        ok: true,
        value: {
          refundId: data.id,
          refundedAmount: Number(data.amount.value),
        },
      };
    } catch (err) {
      return toErrorResult(err, "paypal");
    }
  },

  async verifyWebhook(
    _ctx,
    _payload,
    _signature,
  ): Promise<WebhookEvent | null> {
    // Real verification calls POST /v1/notifications/verify-webhook-signature.
    // Stub for now — reuse the same OAuth token when you wire it up.
    return null;
  },
};

 
type _ = ProcessPaymentInput;
