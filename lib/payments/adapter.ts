import "server-only";

/**
 * Universal payment adapter contract.
 * The one and only adapter used at runtime is DynamicAdapter — every merchant
 * uses the same generic credentials (merchant name, API key, secret, merchant
 * id, environment). No provider-specific code lives in the app.
 */

export type Result<T> =
  | { ok: true; value: T }
  | { ok: false; error: string; code?: string };

export type ProcessPaymentInput = {
  orderId: string;
  amount: number;
  /** ISO 4217 lowercase (usd, aed, eur, …). */
  currency: string;
  customer: { name: string; email: string; phone?: string };
  items: Array<{ name: string; quantity: number; price: number }>;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
};

export type ProcessPaymentOutput = {
  transactionId: string;
  status: "pending" | "authorized" | "captured";
  redirectUrl?: string;
  clientSecret?: string;
};

export type RefundInput = {
  transactionId: string;
  amount?: number;
  reason?: string;
};

export type RefundOutput = {
  refundId: string;
  refundedAmount: number;
};

export type WebhookEvent = {
  id: string;
  type: string;
  transactionId?: string;
  raw: unknown;
};

export interface IPaymentAdapter {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  validateCredentials(): Promise<Result<{ mode: "live" | "test" }>>;
  processPayment(
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>>;
  refund(input: RefundInput): Promise<Result<RefundOutput>>;
  verifyWebhook(
    payload: string,
    signature: string,
  ): Promise<WebhookEvent | null>;
}
