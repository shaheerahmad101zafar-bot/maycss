import "server-only";

import { cookies } from "next/headers";

export const ADMIN_COOKIE = "mc-admin";

export function getSessionToken(): string {
  const fromEnv = process.env.ADMIN_SESSION_TOKEN?.trim();
  if (process.env.NODE_ENV === "production") {
    return fromEnv ?? "";
  }
  return fromEnv || "mc-session-v1";
}

export function getAdminPassword(): string {
  const fromEnv = process.env.ADMIN_PASSWORD?.trim();
  if (process.env.NODE_ENV === "production") {
    return fromEnv ?? "";
  }
  return fromEnv || "maycss-admin";
}

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === getSessionToken();
}
