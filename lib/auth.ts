import "server-only";

import { cookies } from "next/headers";
import { getSessionToken } from "@/lib/auth-config";

export { getAdminPassword, getSessionToken } from "@/lib/auth-config";

export const ADMIN_COOKIE = "mc-admin";

export async function isAdminAuthed(): Promise<boolean> {
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === getSessionToken();
}
