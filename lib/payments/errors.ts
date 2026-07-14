import "server-only";

/**
 * PaymentError — the ONE error surface for the payment engine.
 *
 * Cross-border payments fail in dozens of ways (declined card, currency
 * mismatch, 3DS challenge, provider outage). Every failure the engine
 * raises must map to one of these codes so the UI can localise the
 * message + the admin can filter logs by intent instead of grepping.
 */

export type PaymentErrorCode =
  | "unknown_provider"     // Registry doesn't know this authType/id
  | "not_configured"       // Admin hasn't filled credentials yet
  | "invalid_credentials"  // Provider rejected the key
  | "unsupported_currency" // Store currency not in strategy.supportedCurrencies
  | "amount_below_minimum" // Provider min-charge violation
  | "amount_above_maximum" // Provider max-charge violation
  | "declined"             // Card / wallet declined
  | "network_error"        // Timeout / DNS / TLS
  | "rate_limited"         // Provider throttled us
  | "provider_error"       // Provider 5xx or unexpected response
  | "signature_mismatch"   // Webhook HMAC failed
  | "duplicate_transaction"
  | "refund_not_allowed";

export class PaymentError extends Error {
  readonly code: PaymentErrorCode;
  readonly providerId: string;
  readonly httpStatus?: number;
  readonly raw?: unknown;

  constructor(
    code: PaymentErrorCode,
    message: string,
    opts: { providerId: string; httpStatus?: number; raw?: unknown } = {
      providerId: "unknown",
    },
  ) {
    super(message);
    this.name = "PaymentError";
    this.code = code;
    this.providerId = opts.providerId;
    this.httpStatus = opts.httpStatus;
    this.raw = opts.raw;
  }

  /** Safe JSON shape for logs — hides `raw` (may contain secrets). */
  toJSON() {
    return {
      code: this.code,
      message: this.message,
      providerId: this.providerId,
      httpStatus: this.httpStatus,
    };
  }
}

/** Convenience — always returns a Result without throwing. */
export function toErrorResult(
  err: unknown,
  providerId: string,
): { ok: false; error: string; code: PaymentErrorCode } {
  if (err instanceof PaymentError) {
    return { ok: false, error: err.message, code: err.code };
  }
  const msg = err instanceof Error ? err.message : "Payment gateway error.";
  return {
    ok: false,
    error: `[${providerId}] ${msg}`,
    code: "provider_error",
  };
}
