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

/**
 * Dev-only fallback used when no merchant gateway has been configured yet.
 * Logs to the terminal instead of contacting any real provider.
 */
export class ConsoleAdapter implements IPaymentAdapter {
  readonly id = "console";
  readonly name = "Console (dev-only)";

  isConfigured() {
    return true;
  }

  async validateCredentials(): Promise<Result<{ mode: "live" | "test" }>> {
    return { ok: true, value: { mode: "test" } };
  }

  async processPayment(
    input: ProcessPaymentInput,
  ): Promise<Result<ProcessPaymentOutput>> {
    const transactionId = `dev_${Date.now().toString(36)}`;
    console.log("[payments/console]", { transactionId, orderId: input.orderId, amount: input.amount });
    return {
      ok: true,
      value: { transactionId, status: "captured", redirectUrl: input.successUrl },
    };
  }

  async refund(input: RefundInput): Promise<Result<RefundOutput>> {
    return {
      ok: true,
      value: {
        refundId: `dev_refund_${Date.now().toString(36)}`,
        refundedAmount: input.amount ?? 0,
      },
    };
  }

  async verifyWebhook(): Promise<WebhookEvent | null> {
    return null;
  }
}
