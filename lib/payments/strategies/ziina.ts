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
 * Ziina strategy — UAE payment processor (API key only).
 * Customer-facing UI never shows the Ziina brand; charges are always USD.
 *
 * Docs: https://docs.ziina.com/api-reference/payment-intent/create
 */
export const ziinaStrategy: PaymentStrategy = {
  id: "ziina",
  label: "Card gateway (API key)",
  authType: "api_key",
  apiKeyOnly: true,
  supportedCurrencies: ["usd"],

  fields: [
    {
      key: "apiKey",
      label: "API Key",
      type: "password",
      required: true,
      placeholder: "Paste your live or test API key",
      helper:
        "Saved server-side only. Customers never see this provider’s brand.",
    },
    {
      key: "successRedirectPath",
      label: "Success redirect path",
      type: "text",
      required: false,
      placeholder: "/checkout/success",
      helper: "Optional. Defaults to the order tracking page.",
    },
  ],

  isConfigured(ctx) {
    return Boolean(ctx.credentials.apiKey);
  },

  async validate(ctx) {
    if (!ctx.credentials.apiKey) {
      return { ok: false, error: "API Key is required." };
    }
    try {
      const res = await fetch("https://api-v2.ziina.com/api/payment_intent", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${ctx.credentials.apiKey}`,
        },
        signal: AbortSignal.timeout(5000),
      });
      if (res.status === 401 || res.status === 403) {
        return { ok: false, error: "API key was rejected by the payment gateway." };
      }
      if (res.status >= 500) {
        return { ok: false, error: `Payment gateway returned ${res.status}.` };
      }
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Could not reach payment gateway.",
      };
    }
    const isLive =
      ctx.environment === "live" ||
      ctx.credentials.apiKey.includes("live");
    return { ok: true, value: { mode: isLive ? "live" : "test" } };
  },

  async processPayment(
    ctx,
    input,
  ): Promise<Result<ProcessPaymentOutput>> {
    if (!this.isConfigured(ctx)) {
      return { ok: false, error: "Payment gateway is not configured." };
    }
    // Always charge USD (cents). Customer sees dollars end-to-end.
    const currency = "USD";
    const amountMinor = Math.round(input.amount * 100);
    const message =
      input.metadata?.hosted_message?.trim() ||
      `MAYCSS order ${input.orderId}`;
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
            message,
            test: ctx.environment === "sandbox",
          }),
          signal: AbortSignal.timeout(15000),
        },
      );
      if (!res.ok) {
        const body = await res.text();
        let detail = body.slice(0, 300);
        try {
          const parsed = JSON.parse(body) as {
            message?: string;
            error?: string | { message?: string };
          };
          detail =
            parsed.message ||
            (typeof parsed.error === "string"
              ? parsed.error
              : parsed.error?.message) ||
            detail;
        } catch {
          /* keep raw slice */
        }
        return {
          ok: false,
          error: `Payment gateway rejected the charge (${res.status}): ${detail}`,
          code: `gateway_${res.status}`,
        };
      }
      const data = (await res.json()) as {
        id?: string;
        redirect_url?: string;
        redirectUrl?: string;
        status?: string;
      };
      const redirectUrl = data.redirect_url ?? data.redirectUrl;
      if (!data.id || !redirectUrl) {
        return {
          ok: false,
          error:
            "Payment session was created but no payment link was returned. Check API key permissions (write_payment_intents).",
          code: "gateway_no_redirect",
        };
      }
      return {
        ok: true,
        value: {
          transactionId: data.id,
          status: "pending",
          redirectUrl,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Payment request failed.",
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
