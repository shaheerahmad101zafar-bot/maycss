/** Edge-safe admin auth env helpers (middleware + server actions). */

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
