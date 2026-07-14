import "server-only";

import { getSettings } from "@/lib/settings";
import { ConsoleAdapter } from "./console";
import { DynamicAdapter } from "./dynamic";
import type { IPaymentAdapter } from "./adapter";

export type { IPaymentAdapter } from "./adapter";
export { DynamicAdapter } from "./dynamic";
export type { DynamicPaymentConfig } from "./dynamic";

/**
 * Returns the active payment adapter. Uses DynamicAdapter built from the
 * merchant credentials saved in data/settings.json. Falls back to the
 * ConsoleAdapter in development, throws in production if unconfigured.
 */
export async function getActivePaymentAdapter(): Promise<IPaymentAdapter> {
  const settings = await getSettings();
  const adapter = new DynamicAdapter(settings.payments);
  if (adapter.isConfigured()) return adapter;
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Merchant gateway is not configured. Visit /admin/settings/payments to enter API keys.",
    );
  }
  return new ConsoleAdapter();
}
