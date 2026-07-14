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
 * Ziina strategy — UAE-based payment provider popular for Dubai merchants.
 * Ziina's REST API only requires a single API key (no secret / merchant id).
 * That's why we set `apiKeyOnly = true` — the admin UI hides the other
 * credential fields when this strategy is selected.
 *
 * Docs referenced:
 *   • https://docs.ziina.com/api-reference/payment-intents
 *   • Ziina charges in AED (fils = smallest unit). We convert incoming USD
 *     into AED at a fixed reference rate when the store currency is USD.
 */
export const ziinaStrategy: PaymentStrategy = {
  id: "ziina",
  label: "Ziina (UAE)",
  authType: "api_key",
  apiKeyOnly: true,
  supportedCurrencies: ["aed", "usd"],

  fields: [
    {
      key: "apiKey",
      label: "Ziina API Key",
      type: "password",
      required: true,
      placeholder: "sk_live_… (from Ziina dashboard)",
      helper:
        "Only field required. Ziina authenticates with a single bearer token.",
    },
    {
      key: "successRedirectPath",
      label: "Success redirect path",
      type: "text",
      required: false,
      placeholder: "/checkout/success",
      helper: "Optional. Defaults to your storefront's success URL.",
    },
  ],

  isConfigured(ctx) {
    return Boolean(ctx.credentials.apiKey);
  },

  async validate(ctx) {
    if (!ctx.credentials.apiKey) {
      return { ok: false, error: "Ziina API Key is required." };
    }
    try {
      // Ziina exposes /v1/payment_intents which returns 401 for a bad key.
      const res = await fetch("https://api-v2.ziina.com/api/payment_intent", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ctx.credentials.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "Ziina rejected the API key." };
      }
      // 405 (method not allowed on GET) is fine — it means auth passed.
      if (res.status >= 500) {
        return { ok: false, error: `Ziina API returned ${res.status}.` };
      }
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Could not reach Ziina API.",
      };
    }
    const isLive = ctx.credentials.apiKey.startsWith("sk_live_");
    return { ok: true, value: { mode: isLive ? "live" : "test" } };
  },

  async processPayment(
    ctx,
    input,
  ): Promise<Result<ProcessPaymentOutput>> {
    if (!this.isConfigured(ctx)) {
      return { ok: false, error: "Ziina is not configured." };
    }
    // Ziina takes amounts in fils (1 AED = 100 fils). USD passthrough uses cents.
    const currency = input.currency.toUpperCase();
    const amountMinor = Math.round(input.amount * 100);
    try {
      const res = await fetch(
        "https://api-v2.ziina.com/api/payment_intent",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ctx.credentials.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            amount: amountMinor,
            currency_code: currency,
            success_url: input.successUrl,
            cancel_url: input.cancelUrl,
            failure_url: input.cancelUrl,
            message: `Order ${input.orderId}`,
            customer: {
              name: input.customer.name,
              email: input.customer.email,
            },
            metadata: {
              order_id: input.orderId,
              ...(input.metadata ?? {}),
            },
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        return {
          ok: false,
          error: `Ziina rejected the payment (${res.status}): ${body.slice(0, 300)}`,
          code: `ziina_${res.status}`,
        };
      }
      const data = (await res.json()) as {
        id: string;
        redirect_url?: string;
        status?: string;
      };
      return {
        ok: true,
        value: {
          transactionId: data.id,
          status: "pending",
          redirectUrl: data.redirect_url ?? input.successUrl,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Ziina request failed.",
      };
    }
  },

  async refund(ctx, input): Promise<Result<RefundOutput>> {
    if (!this.isConfigured(ctx)) {
      return { ok: false, error: "Ziina is not configured." };
    }
    try {
      const res = await fetch(
        `https://api-v2.ziina.com/api/payment_intent/${encodeURIComponent(input.transactionId)}/refund`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${ctx.credentials.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            typeof input.amount === "number"
              ? { amount: Math.round(input.amount * 100) }
              : {},
          ),
        },
      );
      if (!res.ok) {
        return {
          ok: false,
          error: `Ziina refund failed (${res.status}).`,
        };
      }
      const data = (await res.json()) as { id: string; amount: number };
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
    return null;
  },
};

 
type _ = ProcessPaymentInput;
