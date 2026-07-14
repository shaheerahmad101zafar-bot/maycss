import "server-only";

import { stripeStrategy } from "./strategies/stripe";
import { ziinaStrategy } from "./strategies/ziina";
import { paypalStrategy } from "./strategies/paypal";
import { genericApiStrategy } from "./strategies/generic-api";
import type {
  AuthType,
  PaymentGatewayInterface,
} from "./strategies/types";

/**
 * PaymentProviderRegistry — the single decoupling seam between the payment
 * engine and any specific gateway.
 *
 * To add a new world-wide gateway:
 *   1. Create `lib/payments/strategies/<name>.ts` that exports a value
 *      implementing `PaymentGatewayInterface`. Pick one `authType`:
 *        • "api_key"      — single bearer token (Ziina, Paystack, Flutterwave)
 *        • "api_secret"   — publishable + secret pair (Stripe, Authorize.net)
 *        • "oauth"        — OAuth 2.0 client-credentials (PayPal, Adyen)
 *        • "generic_api"  — no code required; admin configures via UI
 *   2. Add `PaymentProviderRegistry.register(myStrategy)` below.
 *
 * That's it. The MerchantAdapter picks the strategy at runtime by id; the
 * admin form regenerates itself from `strategy.fields[]`. No `if` branches
 * anywhere in checkout, refund, or webhook code.
 */
class Registry {
  private map = new Map<string, PaymentGatewayInterface>();

  register(strategy: PaymentGatewayInterface): void {
    this.map.set(strategy.id, strategy);
  }

  get(id: string): PaymentGatewayInterface | undefined {
    return this.map.get(id);
  }

  has(id: string): boolean {
    return this.map.has(id);
  }

  list(): PaymentGatewayInterface[] {
    return Array.from(this.map.values());
  }

  listByAuthType(auth: AuthType): PaymentGatewayInterface[] {
    return this.list().filter((s) => s.authType === auth);
  }

  /** Metadata-only view — safe to serialize into a client component. */
  listPublic(): Array<{
    id: string;
    label: string;
    authType: AuthType;
    apiKeyOnly: boolean;
    fields: PaymentGatewayInterface["fields"];
    supportedCurrencies: string[];
  }> {
    return this.list().map((s) => ({
      id: s.id,
      label: s.label,
      authType: s.authType,
      apiKeyOnly: s.apiKeyOnly,
      fields: s.fields,
      supportedCurrencies: s.supportedCurrencies,
    }));
  }
}

export const PaymentProviderRegistry = new Registry();

// ── Register built-in providers ──────────────────────────────────
PaymentProviderRegistry.register(stripeStrategy);       // api_secret
PaymentProviderRegistry.register(ziinaStrategy);        // api_key
PaymentProviderRegistry.register(paypalStrategy);       // oauth
PaymentProviderRegistry.register(genericApiStrategy);   // generic_api

export type { PaymentGatewayInterface, AuthType };
export type PaymentStrategy = PaymentGatewayInterface; // legacy alias
