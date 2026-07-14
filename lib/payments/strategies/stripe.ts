import "server-only";

import type {
  PaymentStrategy,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  RefundOutput,
  Result,
  StrategyContext,
  WebhookEvent,
} from "./types";

/**
 * Stripe strategy — canonical two-key gateway. Publishable key + Secret key
 * are required. Runs against the real Stripe REST API when configured,
 * otherwise returns a helpful error.
 *
 * Docs referenced:
 *   • https://docs.stripe.com/api/checkout/sessions/create
 *   • https://docs.stripe.com/api/refunds/create
 */
export const stripeStrategy: PaymentStrategy = {
  id: "stripe",
  label: "Stripe",
  authType: "api_secret",
  apiKeyOnly: false,
  supportedCurrencies: ["usd", "eur", "gbp", "aed", "aud", "cad"],

  fields: [
    {
      key: "apiKey",
      label: "Publishable Key",
      type: "text",
      required: true,
      placeholder: "pk_live_… or pk_test_…",
      helper: "Safe to expose on the client. Used by Stripe.js on checkout.",
    },
    {
      key: "secretKey",
      label: "Secret Key",
      type: "password",
      required: true,
      placeholder: "sk_live_… or sk_test_…",
      helper: "Server-side only. Never exposed to the browser.",
    },
    {
      key: "webhookSecret",
      label: "Webhook Signing Secret",
      type: "password",
      required: false,
      placeholder: "whsec_…",
      helper: "Optional. Set if you're subscribing to Stripe events.",
    },
  ],

  isConfigured(ctx) {
    return Boolean(ctx.credentials.apiKey && ctx.credentials.secretKey);
  },

  async validate(ctx) {
    if (!ctx.credentials.apiKey) {
      return { ok: false, error: "Stripe Publishable Key is required." };
    }
    if (!ctx.credentials.secretKey) {
      return { ok: false, error: "Stripe Secret Key is required." };
    }
    const isLive =
      ctx.credentials.secretKey.startsWith("sk_live_") ||
      ctx.credentials.apiKey.startsWith("pk_live_");
    if (isLive && ctx.environment === "sandbox") {
      return {
        ok: false,
        error: "Live keys detected while environment is sandbox.",
      };
    }
    // Quick ping — Stripe's /v1/account returns 200 for a valid secret.
    try {
      const res = await fetch("https://api.stripe.com/v1/account", {
        headers: { Authorization: `Bearer ${ctx.credentials.secretKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 401) {
        return { ok: false, error: "Stripe rejected the Secret Key." };
      }
      if (!res.ok && res.status !== 403) {
        return { ok: false, error: `Stripe API returned ${res.status}.` };
      }
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Could not reach Stripe API.",
      };
    }
    return { ok: true, value: { mode: isLive ? "live" : "test" } };
  },

  async processPayment(
    ctx,
    input,
  ): Promise<Result<ProcessPaymentOutput>> {
    if (!this.isConfigured(ctx)) {
      return { ok: false, error: "Stripe is not configured." };
    }
    // Stripe expects amounts in the currency's smallest unit (cents).
    const amountCents = Math.round(input.amount * 100);
    const params = new URLSearchParams();
    params.set("mode", "payment");
    params.set("success_url", input.successUrl);
    params.set("cancel_url", input.cancelUrl);
    params.set("client_reference_id", input.orderId);
    params.set("customer_email", input.customer.email);
    input.items.forEach((item, i) => {
      params.set(`line_items[${i}][quantity]`, String(item.quantity));
      params.set(
        `line_items[${i}][price_data][currency]`,
        input.currency.toLowerCase(),
      );
      params.set(
        `line_items[${i}][price_data][unit_amount]`,
        String(Math.round(item.price * 100)),
      );
      params.set(
        `line_items[${i}][price_data][product_data][name]`,
        item.name,
      );
    });
    if (input.metadata) {
      for (const [k, v] of Object.entries(input.metadata)) {
        params.set(`metadata[${k}]`, v);
      }
    }

    try {
      const res = await fetch(
        "https://api.stripe.com/v1/checkout/sessions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ctx.credentials.secretKey}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false,
          error: `Stripe rejected the session (${res.status}): ${body.slice(0, 300)}`,
          code: `stripe_${res.status}`,
        };
      }
      const data = (await res.json()) as {
        id: string;
        url: string;
      };
      // Log cents for debugging; keep dollars everywhere else.
      void amountCents;
      return {
        ok: true,
        value: {
          transactionId: data.id,
          status: "pending",
          redirectUrl: data.url,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Stripe request failed.",
      };
    }
  },

  async refund(ctx, input): Promise<Result<RefundOutput>> {
    if (!this.isConfigured(ctx)) {
      return { ok: false, error: "Stripe is not configured." };
    }
    const params = new URLSearchParams();
    params.set("payment_intent", input.transactionId);
    if (typeof input.amount === "number") {
      params.set("amount", String(Math.round(input.amount * 100)));
    }
    if (input.reason) params.set("reason", "requested_by_customer");

    try {
      const res = await fetch("https://api.stripe.com/v1/refunds", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${ctx.credentials.secretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params.toString(),
      });
      if (!res.ok) {
        return {
          ok: false,
          error: `Stripe refund failed (${res.status}).`,
        };
      }
      const data = (await res.json()) as {
        id: string;
        amount: number;
      };
      return {
        ok: true,
        value: {
          refundId: data.id,
          refundedAmount: data.amount / 100,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Refund request failed.",
      };
    }
  },

  async verifyWebhook(
    _ctx: StrategyContext,
    _payload: string,
    _signature: string,
  ): Promise<WebhookEvent | null> {
    // Real verification requires HMAC-SHA256 against the whsec.
    // Stub for now; drop in `stripe.webhooks.constructEvent` when the
    // official Stripe Node lib is installed.
    return null;
  },
};

// Suppress unused-input warnings for the stub signatures above.
 
type _ = ProcessPaymentInput;
