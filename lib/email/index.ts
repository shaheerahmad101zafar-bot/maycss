import "server-only";

import type { IEmailAdapter } from "./adapter";
import { ConsoleEmailAdapter } from "./console";
import { ResendEmailAdapter } from "./resend";

export type { IEmailAdapter, EmailMessage } from "./adapter";

/**
 * Choose the email adapter based on env vars.
 *   EMAIL_PROVIDER=resend  → uses Resend if configured
 *   EMAIL_PROVIDER=console → always uses console
 *   (unset) → console in dev, resend in prod (falls back to console if unconfigured)
 */
export function getEmailAdapter(): IEmailAdapter {
  const preferred = process.env.EMAIL_PROVIDER;
  if (preferred === "resend") {
    const r = new ResendEmailAdapter();
    if (r.isConfigured()) return r;
    return new ConsoleEmailAdapter();
  }
  if (preferred === "console") return new ConsoleEmailAdapter();
  if (process.env.NODE_ENV === "production") {
    const r = new ResendEmailAdapter();
    if (r.isConfigured()) return r;
  }
  return new ConsoleEmailAdapter();
}
