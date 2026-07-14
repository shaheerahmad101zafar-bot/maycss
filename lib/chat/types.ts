/**
 * SupportEngine — client-safe types.
 * Storage + REST handlers live in `@/lib/chat/storage` (server-only).
 */

export type Author = "customer" | "admin";

export type ChatMessage = {
  id: string;
  threadId: string;
  from: Author;
  body: string;
  createdAt: string;
  readByAdmin?: boolean;
  readByCustomer?: boolean;
};

export type ChatThread = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  lastMessageAt: string;
  unreadForAdmin: number;
  unreadForCustomer: number;
  messages: ChatMessage[];
};

export type NewThreadInput = { email: string; name: string; body: string };
export type NewMessageInput = { threadId: string; from: Author; body: string };

/** Preview payload safe to send to any client (customer or admin). */
export type ChatThreadSummary = Omit<ChatThread, "messages"> & {
  lastMessage?: { body: string; from: Author; createdAt: string };
};
