"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { ChatMessage, ChatThread } from "@/lib/chat/types";
import { cx } from "@/lib/utils";

const STORAGE_KEY = "maycss.chat.threadId";
const POLL_INTERVAL = 3000;

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [thread, setThread] = useState<ChatThread | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Restore thread id from localStorage on mount
  useEffect(() => {
    try {
      const id = window.localStorage.getItem(STORAGE_KEY);
      if (id) setThreadId(id);
    } catch {
      /* noop */
    }
  }, []);

  // Poll thread updates
  useEffect(() => {
    if (!threadId || !open) return;
    let cancelled = false;
    const fetchOnce = async () => {
      try {
        const res = await fetch(`/api/chat/thread/${threadId}`, {
          cache: "no-store",
        });
        const data = (await res.json()) as { ok: boolean; thread?: ChatThread };
        if (!cancelled && data.ok && data.thread) setThread(data.thread);
      } catch {
        /* noop */
      }
    };
    fetchOnce();
    const t = window.setInterval(fetchOnce, POLL_INTERVAL);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [threadId, open]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread?.messages.length]);

  const onOpen = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !draft.trim()) return;
    setSending(true);
    try {
      const res = await fetch("/api/chat/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, body: draft }),
      });
      const data = (await res.json()) as { ok: boolean; thread?: ChatThread };
      if (data.ok && data.thread) {
        setThread(data.thread);
        setThreadId(data.thread.id);
        window.localStorage.setItem(STORAGE_KEY, data.thread.id);
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  };

  const onSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim() || !threadId) return;
    setSending(true);
    try {
      const res = await fetch(`/api/chat/thread/${threadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from: "customer", body: draft }),
      });
      const data = (await res.json()) as { ok: boolean; message?: ChatMessage };
      if (data.ok && data.message) {
        setThread((prev) =>
          prev
            ? { ...prev, messages: [...prev.messages, data.message!] }
            : prev,
        );
        setDraft("");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={cx("mc-chat", open && "is-open")} aria-live="polite">
      {open && (
        <div className="mc-chat__panel" role="dialog" aria-label="Support chat">
          <header className="mc-chat__header">
            <div>
              <p className="mc-chat__title">Support</p>
              <p className="mc-chat__sub">We usually reply within a few minutes.</p>
            </div>
            <button
              type="button"
              className="mc-chat__close"
              aria-label="Close chat"
              onClick={() => setOpen(false)}
            >
              &times;
            </button>
          </header>

          {!thread && (
            <form className="mc-chat__intro" onSubmit={onOpen}>
              <p className="mc-chat__intro-lead">
                Hi 👋 — tell us who you are, and how we can help.
              </p>
              <div className="mc-field">
                <label htmlFor="chat-name">Your name</label>
                <input
                  id="chat-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
              <div className="mc-field">
                <label htmlFor="chat-email">Email</label>
                <input
                  id="chat-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="mc-field">
                <label htmlFor="chat-first">How can we help?</label>
                <textarea
                  id="chat-first"
                  rows={3}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                className="mc-btn mc-btn--primary mc-btn--block"
                disabled={sending}
              >
                {sending ? "Sending…" : "Start conversation"}
              </button>
            </form>
          )}

          {thread && (
            <>
              <div className="mc-chat__messages" ref={scrollRef}>
                {thread.messages.map((m) => (
                  <div
                    key={m.id}
                    className={cx(
                      "mc-chat__msg",
                      `is-${m.from}`,
                    )}
                  >
                    <p>{m.body}</p>
                    <time>{new Date(m.createdAt).toLocaleTimeString()}</time>
                  </div>
                ))}
              </div>
              <form className="mc-chat__composer" onSubmit={onSend}>
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Type a message…"
                  aria-label="Type a message"
                />
                <button type="submit" disabled={sending || !draft.trim()}>
                  Send
                </button>
              </form>
            </>
          )}
        </div>
      )}

      <button
        type="button"
        className="mc-chat__toggle"
        aria-label={open ? "Close support chat" : "Open support chat"}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "×" : "💬"}
      </button>
    </div>
  );
}
