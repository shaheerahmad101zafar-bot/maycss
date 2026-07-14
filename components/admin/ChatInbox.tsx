"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type {
  ChatMessage,
  ChatThread,
  ChatThreadSummary,
} from "@/lib/chat/types";
import { cx } from "@/lib/utils";

const POLL = 3000;

export default function ChatInbox() {
  const [threads, setThreads] = useState<ChatThreadSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Poll inbox
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const res = await fetch("/api/chat/inbox", { cache: "no-store" });
      const data = (await res.json()) as {
        ok: boolean;
        threads?: ChatThreadSummary[];
      };
      if (!cancelled && data.ok && data.threads) {
        setThreads(data.threads);
        if (!selectedId && data.threads.length) {
          setSelectedId(data.threads[0].id);
        }
      }
    };
    load();
    const t = window.setInterval(load, POLL);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [selectedId]);

  // Poll selected thread
  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    const load = async () => {
      const res = await fetch(`/api/chat/thread/${selectedId}`, {
        cache: "no-store",
      });
      const data = (await res.json()) as { ok: boolean; thread?: ChatThread };
      if (!cancelled && data.ok && data.thread) setThread(data.thread);
    };
    load();
    const t = window.setInterval(load, POLL);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [selectedId]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  const onReply = async (e: FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !selectedId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/thread/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "admin", body: reply }),
      });
      const data = (await res.json()) as { ok: boolean; message?: ChatMessage };
      if (data.ok && data.message) {
        setThread((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message!] } : prev,
        );
        setReply("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mc-chat-inbox">
      <aside className="mc-chat-inbox__list">
        <p className="mc-chat-inbox__list-title">Active conversations</p>
        {threads.length === 0 && (
          <p className="mc-admin__muted" style={{ padding: 16 }}>
            No chats yet. Open the widget on the storefront and start one.
          </p>
        )}
        {threads.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cx(
              "mc-chat-inbox__row",
              t.id === selectedId && "is-selected",
              t.unreadForAdmin > 0 && "is-unread",
            )}
            onClick={() => setSelectedId(t.id)}
          >
            <div>
              <p className="mc-chat-inbox__row-name">{t.name}</p>
              <p className="mc-chat-inbox__row-email">{t.email}</p>
              {t.lastMessage && (
                <p className="mc-chat-inbox__row-preview">
                  <span
                    className={cx(
                      "mc-chat-inbox__preview-from",
                      `is-${t.lastMessage.from}`,
                    )}
                  >
                    {t.lastMessage.from === "admin" ? "You: " : ""}
                  </span>
                  {t.lastMessage.body.slice(0, 80)}
                </p>
              )}
            </div>
            {t.unreadForAdmin > 0 && (
              <span className="mc-chat-inbox__badge">{t.unreadForAdmin}</span>
            )}
          </button>
        ))}
      </aside>

      <section className="mc-chat-inbox__pane">
        {!thread ? (
          <p className="mc-admin__muted" style={{ padding: 40, textAlign: "center" }}>
            Select a conversation.
          </p>
        ) : (
          <>
            <header className="mc-chat-inbox__pane-header">
              <div>
                <p className="mc-chat-inbox__pane-name">{thread.name}</p>
                <p className="mc-chat-inbox__pane-email">
                  <a href={`mailto:${thread.email}`}>{thread.email}</a> · Opened{" "}
                  {new Date(thread.createdAt).toLocaleString()}
                </p>
              </div>
            </header>
            <div className="mc-chat-inbox__messages" ref={scrollRef}>
              {thread.messages.map((m) => (
                <div
                  key={m.id}
                  className={cx("mc-chat-inbox__msg", `is-${m.from}`)}
                >
                  <p>{m.body}</p>
                  <time>{new Date(m.createdAt).toLocaleTimeString()}</time>
                </div>
              ))}
            </div>
            <form className="mc-chat-inbox__reply" onSubmit={onReply}>
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Type a reply…"
                aria-label="Reply to conversation"
              />
              <button
                type="submit"
                className="mc-btn mc-btn--primary"
                disabled={sending || !reply.trim()}
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  );
}
