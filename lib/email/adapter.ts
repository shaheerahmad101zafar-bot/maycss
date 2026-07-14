import "server-only";

import type { Result } from "@/lib/payments/adapter";

export type EmailMessage = {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export interface IEmailAdapter {
  readonly id: string;
  readonly name: string;
  isConfigured(): boolean;
  send(msg: EmailMessage): Promise<Result<{ messageId: string }>>;
}
