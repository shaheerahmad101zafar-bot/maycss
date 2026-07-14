import "server-only";

import { MerchantAdapter } from "./dynamic";
import { PaymentError } from "./errors";
import { getSettings } from "@/lib/settings";
import type {
  IPaymentAdapter,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  RefundInput,
  RefundOutput,
  Result,
  WebhookEvent,
} from "./adapter";

/**
 * PaymentEngine — the ONE object the rest of the app talks to.
 *
 * Every callsite (checkout action, refund action, webhook handler) calls
 * `PaymentEngine.processPayment(...)` and never sees an adapter class name.
 * The engine loads the active merchant from settings.json, spins up the
 * right MerchantAdapter (which delegates to the registered strategy), and
 * wraps the whole call so uncaught throws become typed PaymentErrors.
 *
 * Add multi-merchant support later by extending `getAdapter()` to accept a
 * merchant key + reading `settings.payments[key]` — the interface stays.
 */

async function getAdapter(): Promise<IPaymentAdapter> {
  const s = await getSettings();
  return new MerchantAdapter(s.payments);
}

export const PaymentEngine = {
  /** Human-readable name of the active gateway (for confirmation emails etc.). */
  async gatewayName(): Promise<string> {
    const a = await getAdapter();
    return a.name;
  },

  async isReady(): Promise<boolean> {
    const a = await getAdapter();
    return a.isConfigured();
  },

  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>> {
    try {
      const a = await getAdapter();
      if (!a.isConfigured()) {
        throw new PaymentError(
          "not_configured",
          "The store's payment gateway is not configured.",
          { providerId: a.name },
        );
      }
      return await a.processPayment(input);
    } catch (err) {
      if (err instanceof PaymentError) {
        return { ok: false, error: err.message, code: err.code };
      }
      const msg = err instanceof Error ? err.message : "Payment failed.";
      console.error("[PaymentEngine.processPayment]", err);
      return { ok: false, error: msg, code: "provider_error" };
    }
  },

  async refund(input: RefundInput): Promise<Result<RefundOutput>> {
    try {
      const a = await getAdapter();
      return await a.refund(input);
    } catch (err) {
      if (err instanceof PaymentError) {
        return { ok: false, error: err.message, code: err.code };
      }
      const msg = err instanceof Error ? err.message : "Refund failed.";
      console.error("[PaymentEngine.refund]", err);
      return { ok: false, error: msg };
    }
  },

  async verifyWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null> {
    try {
      const a = await getAdapter();
      return await a.verifyWebhook(payload, signature);
    } catch (err) {
      console.warn("[PaymentEngine.verifyWebhook]", err);
      return null;
    }
  },
};
