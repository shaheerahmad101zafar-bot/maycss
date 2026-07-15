import "server-only";

import type {
  Author,
  ChatMessage,
  ChatThread,
  ChatThreadSummary,
  NewMessageInput,
  NewThreadInput,
} from "./types";
import {
  PollingTransport,
  type ChatTransport,
} from "./transport";
import { readStoreJson, writeStoreJson } from "../storage/json-store";

const file = "data/chat.json";

async function readAll(): Promise<ChatThread[]> {
  return readStoreJson<ChatThread[]>(file, []);
}

async function writeAll(list: ChatThread[]): Promise<void> {
  await writeStoreJson(file, list);
}

const rid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/**
 * SupportEngine — persistence + broadcast for the customer support chat.
 *
 *   • Persistence:   `data/chat.json` (file-backed today; swap for a DB
 *                     driver by replacing readAll / writeAll).
 *   • Realtime:      injectable ChatTransport (`PollingTransport` by
 *                     default; drop in a SocketTransport with
 *                     `configureSupport({ transport })` and nothing else
 *                     changes).
 *
 * All mutations return the updated document AND emit an event on the
 * transport, so both polling clients and socket subscribers stay in sync.
 */
export class SupportEngineImpl {
  constructor(private transport: ChatTransport = new PollingTransport()) {}

  setTransport(transport: ChatTransport) {
    this.transport = transport;
  }

  async openThread(input: NewThreadInput): Promise<ChatThread> {
    const all = await readAll();
    const now = new Date().toISOString();
    const first: ChatMessage = {
      id: rid(),
      threadId: "",
      from: "customer",
      body: input.body,
      createdAt: now,
      readByAdmin: false,
      readByCustomer: true,
    };
    const thread: ChatThread = {
      id: rid(),
      email: input.email,
      name: input.name,
      createdAt: now,
      lastMessageAt: now,
      unreadForAdmin: 1,
      unreadForCustomer: 0,
      messages: [{ ...first, threadId: "" }],
    };
    thread.messages[0].threadId = thread.id;
    all.unshift(thread);
    await writeAll(all);
    await this.transport.emit({ type: "thread:new", thread });
    return thread;
  }

  async getThread(id: string): Promise<ChatThread | null> {
    const all = await readAll();
    return all.find((t) => t.id === id) ?? null;
  }

  async listActive(): Promise<ChatThreadSummary[]> {
    const all = await readAll();
    return all
      .slice()
      .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt))
      .map((t) => {
        const last = t.messages[t.messages.length - 1];
        const { messages: _m, ...summary } = t;
        return {
          ...summary,
          lastMessage: last
            ? { body: last.body, from: last.from, createdAt: last.createdAt }
            : undefined,
        };
      });
  }

  async append(input: NewMessageInput): Promise<ChatMessage> {
    const all = await readAll();
    const idx = all.findIndex((t) => t.id === input.threadId);
    if (idx < 0) throw new Error("Thread not found.");
    const msg: ChatMessage = {
      id: rid(),
      threadId: input.threadId,
      from: input.from,
      body: input.body,
      createdAt: new Date().toISOString(),
      readByAdmin: input.from === "admin",
      readByCustomer: input.from === "customer",
    };
    const thread = all[idx];
    thread.messages.push(msg);
    thread.lastMessageAt = msg.createdAt;
    if (input.from === "customer") thread.unreadForAdmin += 1;
    else thread.unreadForCustomer += 1;
    await writeAll(all);
    await this.transport.emit({ type: "message:new", message: msg });
    return msg;
  }

  async markRead(threadId: string, by: Author): Promise<void> {
    const all = await readAll();
    const t = all.find((x) => x.id === threadId);
    if (!t) return;
    for (const m of t.messages) {
      if (by === "admin") m.readByAdmin = true;
      else m.readByCustomer = true;
    }
    if (by === "admin") t.unreadForAdmin = 0;
    else t.unreadForCustomer = 0;
    await writeAll(all);
    await this.transport.emit({ type: "thread:read", threadId, by });
  }
}

// Singleton used across the app. Keeps backward compatibility with the
// previous `import { SupportEngine } from "@/lib/chat/storage"` shape.
export const SupportEngine = new SupportEngineImpl();

/**
 * Swap the transport at runtime (e.g. once you wire Socket.io):
 *   configureSupport({ transport: new SocketTransport(io) });
 */
export function configureSupport(opts: { transport: ChatTransport }): void {
  SupportEngine.setTransport(opts.transport);
}
