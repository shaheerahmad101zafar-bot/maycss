import "server-only";

import type { ChatMessage, ChatThread } from "./types";

/**
 * ChatTransport — realtime abstraction.
 *
 * SupportEngine owns persistence; ChatTransport owns delivery. Today the
 * PollingTransport is a no-op because clients poll GET /api/chat/thread/[id]
 * every 3 seconds. Tomorrow, swap this for a SocketTransport that emits
 * events over Socket.io — SupportEngine keeps calling `transport.emit(...)`
 * without knowing the difference.
 *
 * The engine calls `transport.emit()` after every mutation (openThread /
 * append / markRead). Return an unsubscribe function from `subscribe` so
 * a socket implementation can clean up listeners when a client disconnects.
 */

export type ChatEvent =
  | { type: "thread:new"; thread: ChatThread }
  | { type: "message:new"; message: ChatMessage }
  | { type: "thread:read"; threadId: string; by: "admin" | "customer" };

export type Unsubscribe = () => void;

export interface ChatTransport {
  /** Broadcast an event to all listeners for a thread (or globally). */
  emit(event: ChatEvent): Promise<void>;

  /**
   * Wire up a listener for a given thread. Used by future socket-based
   * transports; polling transport returns a no-op.
   */
  subscribe(
    threadId: string,
    listener: (event: ChatEvent) => void,
  ): Unsubscribe;
}

/**
 * PollingTransport — the default. Emit is a no-op; the client already polls,
 * so realtime delivery is free (at the cost of ~1 extra request every 3s).
 * Optimised for zero-dependency deploys.
 */
export class PollingTransport implements ChatTransport {
  async emit(_event: ChatEvent): Promise<void> {
    // Intentionally empty. Clients poll for updates.
  }

  subscribe(
    _threadId: string,
    _listener: (event: ChatEvent) => void,
  ): Unsubscribe {
    return () => {};
  }
}

/**
 * Example placeholder for a future Socket.io transport. When you swap it in,
 * inject via `configureSupport({ transport: new SocketTransport(io) })` and
 * every SupportEngine call starts pushing over sockets automatically.
 */
export class InMemoryTransport implements ChatTransport {
  private listeners = new Map<string, Set<(event: ChatEvent) => void>>();

  async emit(event: ChatEvent): Promise<void> {
    const threadId =
      "message" in event
        ? event.message.threadId
        : "thread" in event
        ? event.thread.id
        : event.threadId;
    for (const l of this.listeners.get(threadId) ?? []) {
      try {
        l(event);
      } catch (err) {
        console.warn("[ChatTransport] listener threw", err);
      }
    }
  }

  subscribe(
    threadId: string,
    listener: (event: ChatEvent) => void,
  ): Unsubscribe {
    if (!this.listeners.has(threadId)) {
      this.listeners.set(threadId, new Set());
    }
    this.listeners.get(threadId)!.add(listener);
    return () => this.listeners.get(threadId)?.delete(listener);
  }
}
