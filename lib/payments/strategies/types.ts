import "server-only";

import type {
  IPaymentAdapter,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  RefundInput,
  RefundOutput,
  Result,
  WebhookEvent,
} from "../adapter";

/**
 * A PaymentStrategy is the runtime brain of a specific gateway (Stripe, Ziina,
 * PayPal…). Each strategy declares which credential fields it needs, and
 * implements the network calls the platform makes on checkout / refund /
 * webhook. The MerchantAdapter is a thin shell that delegates to whichever
 * strategy is currently selected in PaymentSettings.
 */

export type CredentialFieldType = "text" | "password" | "select" | "url";

export type CredentialField = {
  key: string;
  label: string;
  type: CredentialFieldType;
  required: boolean;
  placeholder?: string;
  helper?: string;
  options?: Array<{ label: string; value: string }>;
};

export type StrategyCredentials = Record<string, string>;

export type StrategyContext = {
  credentials: StrategyCredentials;
  environment: "sandbox" | "live";
  currency: string; // ISO 4217, e.g. "usd" | "aed" | "eur"
};

/**
 * Auth-type taxonomy — matches the labels the admin sees in the "type"
 * dropdown. Adding a new provider = pick one of these and implement the
 * matching request shape. No taxonomy = the registry can't route it.
 */
export type AuthType =
  | "api_key"       // Single bearer token (Ziina, Paystack, etc.)
  | "api_secret"    // Publishable + Secret pair (Stripe, Authorize.net)
  | "oauth"         // OAuth 2.0 client-credentials flow (PayPal, Adyen)
  | "generic_api";  // Fully-declarative REST adapter — no code required

/**
 * PaymentGatewayInterface — the ONE contract every gateway must satisfy.
 *
 * Any future gateway (Adyen, Razorpay, Paystack, Local Bank X, …) becomes a
 * plug-in the moment it implements this shape and registers with the
 * PaymentProviderRegistry. The rest of the app never learns the provider's
 * name — it goes through the Engine which delegates to whichever gateway
 * is currently active in PaymentSettings.
 */
export interface PaymentGatewayInterface {
  /** Machine id — matches PaymentSettings.provider. */
  readonly id: string;
  /** Human label shown in the admin dropdown. */
  readonly label: string;
  /** Authentication family — drives which credential fields the admin sees. */
  readonly authType: AuthType;
  /**
   * When true, only `apiKey` is required. Legacy alias for `authType === "api_key"`;
   * kept so the existing PaymentSettingsForm keeps working.
   */
  readonly apiKeyOnly: boolean;
  /**
   * Declarative schema for the admin credentials form. The admin UI reads
   * this list to render inputs — that's how the registry stays decoupled
   * from UI code.
   */
  readonly fields: CredentialField[];
  /** ISO 4217 codes this strategy supports natively. */
  readonly supportedCurrencies: string[];

  isConfigured(ctx: StrategyContext): boolean;

  validate(ctx: StrategyContext): Promise<Result<{ mode: "live" | "test" }>>;

  processPayment(
    ctx: StrategyContext,
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>>;

  refund(
    ctx: StrategyContext,
    input: RefundInput,
  ): Promise<Result<RefundOutput>>;

  verifyWebhook(
    ctx: StrategyContext,
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null>;
}

/** Legacy alias — old code imports `PaymentStrategy`. Same shape. */
export type PaymentStrategy = PaymentGatewayInterface;

/** Type re-exports so downstream imports have one path. */
export type {
  IPaymentAdapter,
  ProcessPaymentInput,
  ProcessPaymentOutput,
  RefundInput,
  RefundOutput,
  Result,
  WebhookEvent,
};
