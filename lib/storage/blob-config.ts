import type { BlobAccessType } from "@vercel/blob";

/**
 * Vercel Blob env (no prefixes):
 *   BLOB_READ_WRITE_TOKEN — read/write token (optional when OIDC + store id are set)
 *   BLOB_STORE_ID         — store id (store_… or plain id from Vercel dashboard)
 *   BLOB_WEBHOOK_PUBLIC_KEY — used for client/presigned upload webhooks (optional here)
 *   BLOB_STORE_ACCESS     — "public" | "private" (must match your Blob store type)
 */
export type BlobAuth = {
  enabled: boolean;
  access: BlobAccessType;
  token?: string;
  storeId?: string;
};

export function getBlobAccess(): BlobAccessType {
  const raw = process.env.BLOB_STORE_ACCESS?.trim().toLowerCase();
  if (raw === "public" || raw === "private") return raw;
  // Default public — matches Vercel Blob stores created with --access public.
  return "public";
}

export function usesBlobStorage(): boolean {
  // Temporary escape hatch when the Blob store is suspended / blocked —
  // storefront then reads bundled data/*.json from the deployment.
  if (
    process.env.BLOB_DISABLED === "1" ||
    process.env.BLOB_FORCE_LOCAL === "1"
  ) {
    return false;
  }
  return Boolean(
    process.env.BLOB_READ_WRITE_TOKEN?.trim() ||
      process.env.BLOB_STORE_ID?.trim(),
  );
}

export function getBlobAuth(): BlobAuth {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  const storeId = normalizeStoreId(process.env.BLOB_STORE_ID?.trim());
  const enabled = usesBlobStorage();

  return {
    enabled,
    access: getBlobAccess(),
    ...(token ? { token } : {}),
    ...(storeId ? { storeId } : {}),
  };
}

function normalizeStoreId(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  return raw.startsWith("store_") ? raw : raw;
}
