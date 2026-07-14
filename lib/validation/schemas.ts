import { z } from "zod";

/**
 * Zod schemas — the single source of truth for input validation across
 * server actions and API routes. Every route calls `schema.safeParse(input)`
 * and returns `{ ok: false, error: ... }` on failure. No hand-rolled
 * `if (typeof x !== 'string')` chains anywhere in the app.
 */

/* ─── Checkout / order placement ─────────────────────────────── */

export const orderItemSchema = z.object({
  id: z.union([z.string(), z.number()]),
  name: z.string().min(1),
  brand: z.string().optional(),
  image: z.string(),
  price: z.number().nonnegative(),
  quantity: z.number().int().positive(),
});

export const placeOrderSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email." }),
  firstName: z.string().min(1, "First name is required."),
  lastName: z.string().min(1, "Last name is required."),
  phone: z
    .string()
    .max(30)
    .optional()
    .or(z.literal("")),
  address1: z.string().min(1, "Street address is required."),
  address2: z.string().optional().or(z.literal("")),
  city: z.string().min(1, "City is required."),
  state: z.string().min(1, "State / region is required."),
  zip: z.string().min(1, "ZIP / postal code is required."),
  items: z.array(orderItemSchema).min(1, "Your bag is empty."),
  payment: z.object({
    method: z.enum(["card", "manual"]),
    methodId: z.string().optional(),
  }),
  couponCode: z
    .string()
    .max(40)
    .optional()
    .or(z.literal("")),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

/* ─── Support chat ───────────────────────────────────────────── */

export const newThreadSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(80),
  body: z.string().min(1).max(2000),
});

export const newMessageSchema = z.object({
  threadId: z.string().min(1),
  from: z.enum(["customer", "admin"]),
  body: z.string().min(1).max(2000),
});

/* ─── Product scraper ────────────────────────────────────────── */

export const scrapeUrlSchema = z.object({
  url: z.string().url({ message: "URL must be valid." }),
});

/* ─── Payment settings ───────────────────────────────────────── */

export const paymentSettingsSchema = z.object({
  provider: z.string().min(1),
  merchantName: z.string().min(1).max(60),
  apiKey: z.string().max(500),
  secretKey: z.string().max(500).optional().or(z.literal("")),
  merchantId: z.string().max(120).optional().or(z.literal("")),
  environment: z.enum(["sandbox", "live"]),
  apiBaseUrl: z.string().url().optional().or(z.literal("")),
  webhookSecret: z.string().max(500).optional().or(z.literal("")),
  currency: z.string().min(3).max(3).default("usd"),
  enabled: z.boolean(),
});

export type PaymentSettingsInput = z.infer<typeof paymentSettingsSchema>;

/* ─── AppConfig ──────────────────────────────────────────────── */

export const appConfigSchema = z.object({
  siteName: z.string().min(1).max(60),
  tagline: z.string().min(1).max(200),
  contactEmail: z.string().email(),
  supportPhone: z.string().max(40).optional().or(z.literal("")),
  currency: z.string().min(3).max(3).default("usd"),
  analytics: z
    .object({
      googleAnalyticsId: z.string().max(60).optional().or(z.literal("")),
      metaPixelId: z.string().max(60).optional().or(z.literal("")),
      plausibleDomain: z.string().max(120).optional().or(z.literal("")),
    })
    .default({}),
  socials: z.object({
    facebook: z.string().max(300).optional().or(z.literal("")),
    instagram: z.string().max(300).optional().or(z.literal("")),
    twitter: z.string().max(300).optional().or(z.literal("")),
    tiktok: z.string().max(300).optional().or(z.literal("")),
    youtube: z.string().max(300).optional().or(z.literal("")),
    linkedin: z.string().max(300).optional().or(z.literal("")),
  }),
});

export type AppConfigInput = z.infer<typeof appConfigSchema>;

/* ─── Utility ────────────────────────────────────────────────── */

/**
 * Reduce a Zod error into a plain "field: message" object suitable for
 * displaying next to form inputs.
 */
export function zodFieldErrors(err: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_root";
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}
