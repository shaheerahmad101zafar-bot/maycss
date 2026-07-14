import "server-only";

import type {
  IPaymentAdapter,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  RefundInput,
  RefundOutput,
  Result,
  WebhookEvent,
} from "./adapter";
import { PaymentProviderRegistry } from "./registry";
import type { StrategyContext } from "./strategies/types";

/**
 * MerchantAdapter — the runtime object the rest of the app talks to.
 *
 * It's a thin façade over PaymentProviderRegistry: give it a config bundle
 * (`provider` id + credentials) and it delegates every call to whichever
 * strategy the admin selected. Callers see IPaymentAdapter and never know
 * whether they're talking to Stripe or Ziina.
 *
 * ↳ Kept the old `DynamicAdapter` export name so existing imports keep
 *   working during the migration.
 */
export type DynamicPaymentConfig = {
  /** Provider id, e.g. "stripe" | "ziina". Falls back to legacy "dynamic". */
  provider?: string;
  /** Human name — used as fallback label + on the storefront summary. */
  merchantName: string;
  apiKey: string;
  secretKey: string;
  merchantId: string;
  environment: "sandbox" | "live";
  apiBaseUrl?: string;
  webhookSecret?: string;
  successRedirectPath?: string;
  enabled: boolean;
  currency?: string;
};

export class MerchantAdapter implements IPaymentAdapter {
  readonly id = "merchant";
  constructor(private cfg: DynamicPaymentConfig) {}

  get name(): string {
    const s = this.strategy();
    return s?.label ?? this.cfg.merchantName ?? "Merchant Gateway";
  }

  /** Look up the strategy for this adapter — undefined = misconfigured. */
  private strategy() {
    const id = this.cfg.provider?.toLowerCase();
    if (!id) return undefined;
    return PaymentProviderRegistry.get(id);
  }

  private context(): StrategyContext {
    return {
      credentials: {
        apiKey: this.cfg.apiKey,
        secretKey: this.cfg.secretKey,
        merchantId: this.cfg.merchantId,
        apiBaseUrl: this.cfg.apiBaseUrl ?? "",
        webhookSecret: this.cfg.webhookSecret ?? "",
        successRedirectPath: this.cfg.successRedirectPath ?? "",
      },
      environment: this.cfg.environment,
      currency: (this.cfg.currency ?? "usd").toLowerCase(),
    };
  }

  isConfigured(): boolean {
    if (!this.cfg.enabled) return false;
    const s = this.strategy();
    if (!s) return false;
    return s.isConfigured(this.context());
  }

  async validateCredentials(): Promise<Result<{ mode: "live" | "test" }>> {
    if (!this.cfg.enabled) {
      return { ok: false, error: "Payment gateway is disabled." };
    }
    const s = this.strategy();
    if (!s) {
      return {
        ok: false,
        error: `Unknown payment provider "${this.cfg.provider}". Register it in PaymentProviderRegistry.`,
      };
    }
    return s.validate(this.context());
  }

  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>> {
    const s = this.strategy();
    if (!s) {
      return {
        ok: false,
        error: "No payment provider configured.",
        code: "no_provider",
      };
    }
    try {
      return await s.processPayment(this.context(), input);
    } catch (err) {
      // Cross-border safety net — never let a raw exception surface to
      // the checkout UI. Log + return a user-safe message.
      console.error("[MerchantAdapter.processPayment]", err);
      return {
        ok: false,
        error:
          err instanceof Error
            ? `Payment processor error: ${err.message}`
            : "Payment processor error.",
        code: "gateway_error",
      };
    }
  }

  async refund(input: RefundInput): Promise<Result<RefundOutput>> {
    const s = this.strategy();
    if (!s) return { ok: false, error: "No payment provider configured." };
    try {
      return await s.refund(this.context(), input);
    } catch (err) {
      console.error("[MerchantAdapter.refund]", err);
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Refund gateway error.",
      };
    }
  }

  async verifyWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null> {
    const s = this.strategy();
    if (!s) return null;
    return s.verifyWebhook(this.context(), payload, signature);
  }
}

/** Legacy export alias — kept so existing `new DynamicAdapter(...)` still works. */
export const DynamicAdapter = MerchantAdapter;
