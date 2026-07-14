"use client";

import dynamic from "next/dynamic";

/**
 * Chat is heavy (state, polling, form) and most visitors never open it.
 * We defer it out of the initial layout bundle entirely.
 */
const ChatWidget = dynamic(() => import("./ChatWidget"), {
  ssr: false,
  loading: () => null,
});

export default function ChatWidgetLoader() {
  return <ChatWidget />;
}
