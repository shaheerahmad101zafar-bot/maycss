import "server-only";

/**
 * Very small in-memory token-bucket rate limiter. Works out of the box for
 * a single-node Next.js server. Swap the internal Map for Redis / Upstash
 * KV when the app goes multi-node.
 */

type Bucket = {
  tokens: number;
  updatedAt: number;
};

const buckets = new Map<string, Bucket>();

export type RateLimitOptions = {
  /** Max requests per window. Refills evenly over the window. */
  requests: number;
  /** Window length in milliseconds. */
  windowMs: number;
};

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetInMs: number;
};

/**
 * Reserve one token for the given key. Returns `{ allowed: false, ... }`
 * when the caller has exceeded the limit.
 */
export function rateLimit(
  key: string,
  opts: RateLimitOptions,
): RateLimitResult {
  const now = Date.now();
  const capacity = opts.requests;
  const refillPerMs = capacity / opts.windowMs;

  const bucket = buckets.get(key) ?? { tokens: capacity, updatedAt: now };
  const elapsed = Math.max(0, now - bucket.updatedAt);
  const refilled = Math.min(capacity, bucket.tokens + elapsed * refillPerMs);

  if (refilled < 1) {
    const resetInMs = Math.ceil((1 - refilled) / refillPerMs);
    buckets.set(key, { tokens: refilled, updatedAt: now });
    return { allowed: false, remaining: 0, resetInMs };
  }

  const remaining = refilled - 1;
  buckets.set(key, { tokens: remaining, updatedAt: now });
  return {
    allowed: true,
    remaining: Math.floor(remaining),
    resetInMs: Math.ceil((capacity - remaining) / refillPerMs),
  };
}

/** Extract a stable rate-limit key from a Next.js Request. */
export function clientKey(req: Request, scope = "global"): string {
  const fwd =
    req.headers.get("x-forwarded-for") ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const ip = fwd.split(",")[0]?.trim() || "unknown";
  return `${scope}:${ip}`;
}

/**
 * Standard 429 response envelope for API routes:
 *   const rl = rateLimit(clientKey(req, "scrape"), { requests: 5, windowMs: 60_000 });
 *   if (!rl.allowed) return rateLimitedResponse(rl);
 */
export function rateLimitedResponse(rl: RateLimitResult): Response {
  return new Response(
    JSON.stringify({
      ok: false,
      error: "Too many requests. Please slow down.",
      resetInMs: rl.resetInMs,
    }),
    {
      status: 429,
      headers: {
        "content-type": "application/json",
        "retry-after": String(Math.ceil(rl.resetInMs / 1000)),
      },
    },
  );
}
