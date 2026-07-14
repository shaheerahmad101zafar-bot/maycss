import "server-only";

import type { IEmailAdapter, EmailMessage } from "./adapter";
import type { Result } from "@/lib/payments/adapter";

/** Dev adapter — writes emails to the terminal instead of delivering. */
export class ConsoleEmailAdapter implements IEmailAdapter {
  readonly id = "console";
  readonly name = "Console (dev-only)";
  isConfigured() {
    return true;
  }
  async send(msg: EmailMessage): Promise<Result<{ messageId: string }>> {
    console.log("\n─── [email/console] ──────────────────────────────");
    console.log(`  To:      ${msg.to}`);
    console.log(`  From:    ${msg.from ?? "MayCSS <hello@maycss.example>"}`);
    console.log(`  Subject: ${msg.subject}`);
    console.log(`\n${msg.text}\n`);
    console.log("──────────────────────────────────────────────────\n");
    return {
      ok: true,
      value: { messageId: `dev_${Date.now().toString(36)}` },
    };
  }
}
