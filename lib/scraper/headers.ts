import "server-only";

/**
 * Rotating pool of realistic desktop Chrome + Safari User-Agents.
 * We pick one per attempt so retries look like different sessions.
 */
export const USER_AGENTS: string[] = [
  // Chrome on Windows 11
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  // Chrome on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  // Safari on macOS
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  // Edge on Windows
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
];

export function pickUserAgent(seed?: number): string {
  const i = seed !== undefined
    ? seed % USER_AGENTS.length
    : Math.floor(Math.random() * USER_AGENTS.length);
  return USER_AGENTS[i];
}

/**
 * Build a full Chrome-shaped header set for a URL, including a plausible
 * Referer (Google search or the target site's own origin).
 */
export function buildHumanHeaders(
  targetUrl: string,
  userAgent: string,
): Record<string, string> {
  let referer = "https://www.google.com/";
  try {
    const u = new URL(targetUrl);
    // Sometimes an on-origin referer bypasses referrer-based blocks.
    // We alternate: half the time we pretend the user is browsing the same
    // store, half the time we pretend they landed from Google.
    if (Math.random() < 0.5) referer = `${u.protocol}//${u.host}/`;
  } catch {
    /* invalid URL — leave google referer */
  }

  const isChrome = userAgent.includes("Chrome") && !userAgent.includes("Edg");
  const isEdge = userAgent.includes("Edg");
  const brand = isEdge
    ? '"Microsoft Edge";v="124", "Chromium";v="124", "Not.A/Brand";v="24"'
    : '"Chromium";v="124", "Google Chrome";v="124", "Not.A/Brand";v="24"';

  return {
    "User-Agent": userAgent,
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br, zstd",
    "Cache-Control": "max-age=0",
    Referer: referer,
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": referer.includes("google") ? "cross-site" : "same-origin",
    "Sec-Fetch-User": "?1",
    ...(isChrome || isEdge
      ? {
          "sec-ch-ua": brand,
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": userAgent.includes("Mac") ? '"macOS"' : '"Windows"',
        }
      : {}),
    Connection: "keep-alive",
  };
}
