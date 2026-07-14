import "server-only";

import type { IEmailAdapter, EmailMessage } from "./adapter";
import type { Result } from "@/lib/payments/adapter";

/**
 * Resend adapter — POSTs to the Resend REST API. No SDK dependency.
 * Requires:  RESEND_API_KEY  (env)   EMAIL_FROM  (env, e.g. "MayCSS <hello@yourdomain.com>")
 */
export class ResendEmailAdapter implements IEmailAdapter {
  readonly id = "resend";
  readonly name = "Resend";
  private apiKey = process.env.RESEND_API_KEY ?? "";
  private defaultFrom =
    process.env.EMAIL_FROM ?? "MayCSS <onboarding@resend.dev>";

  isConfigured() {
    return this.apiKey.length > 0;
  }

  async send(msg: EmailMessage): Promise<Result<{ messageId: string }>> {
    if (!this.isConfigured()) {
      return { ok: false, error: "RESEND_API_KEY is not set." };
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: msg.from ?? this.defaultFrom,
          to: msg.to,
          subject: msg.subject,
          html: msg.html,
          text: msg.text,
          reply_to: msg.replyTo,
        }),
      });
      if (!res.ok) {
        const bodyText = await res.text();
        return {
          ok: false,
          error: `Resend returned ${res.status}: ${bodyText.slice(0, 200)}`,
        };
      }
      const json = (await res.json()) as { id?: string };
      return { ok: true, value: { messageId: json.id ?? "unknown" } };
    } catch (err) {
      return {
        ok: false,
        error:
          err instanceof Error ? err.message : "Failed to reach Resend API.",
      };
    }
  }
}
