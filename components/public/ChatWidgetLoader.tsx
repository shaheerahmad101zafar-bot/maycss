"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

/**
 * Chat is heavy — keep it out of first paint entirely.
 * Boot only after idle / first interaction / timeout.
 */
const ChatWidget = dynamic(() => import("./ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export default function ChatWidgetLoader() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let done = false;
    const boot = () => {
      if (done) return;
      done = true;
      setReady(true);
      window.removeEventListener("scroll", boot);
      window.removeEventListener("pointerdown", boot);
    };

    window.addEventListener("scroll", boot, { once: true, passive: true });
    window.addEventListener("pointerdown", boot, { once: true });

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    let idleId = 0;
    let timeoutId = 0;
    if (typeof w.requestIdleCallback === "function") {
      idleId = w.requestIdleCallback(boot, { timeout: 4500 });
    } else {
      timeoutId = window.setTimeout(boot, 3500);
    }

    return () => {
      done = true;
      window.removeEventListener("scroll", boot);
      window.removeEventListener("pointerdown", boot);
      if (idleId && w.cancelIdleCallback) w.cancelIdleCallback(idleId);
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, []);

  return ready ? <ChatWidget /> : null;
}
