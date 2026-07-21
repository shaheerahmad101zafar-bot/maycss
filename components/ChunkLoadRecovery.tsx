"use client";

import { useEffect } from "react";

/**
 * After rapid redeploys, a crawler/browser can hold HTML that points at
 * deleted `/_next/static` chunks. Reload once so it picks up the current build.
 */
export default function ChunkLoadRecovery() {
  useEffect(() => {
    const key = "mc-chunk-reload";
    const onError = (event: ErrorEvent) => {
      const msg = String(event.message || "");
      const src = String((event.target as HTMLElement | null)?.getAttribute?.("src") || "");
      const isChunk =
        /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to fetch dynamically imported module/i.test(
          msg,
        ) ||
        (/\/_next\/static\//.test(src) && event.target instanceof HTMLScriptElement);
      if (!isChunk) return;
      if (sessionStorage.getItem(key) === "1") return;
      sessionStorage.setItem(key, "1");
      window.location.reload();
    };
    window.addEventListener("error", onError, true);
    return () => window.removeEventListener("error", onError, true);
  }, []);

  return null;
}
