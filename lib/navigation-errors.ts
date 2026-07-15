/** Re-throw Next.js redirect/notFound control-flow errors caught in try/catch. */
export function isNextNavigationError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const digest = (error as { digest?: unknown }).digest;
  return (
    typeof digest === "string" &&
    (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND"))
  );
}

export function rethrowIfNavigationError(error: unknown): void {
  if (isNextNavigationError(error)) throw error;
}
