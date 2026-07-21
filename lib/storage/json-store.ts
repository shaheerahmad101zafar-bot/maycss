import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { del, get, put } from "@vercel/blob";
import { getBlobAuth, usesBlobStorage } from "./blob-config";

/** Relative path from project root, e.g. `data/products.json`. */
export type StorePath = string;

export { usesBlobStorage };

export type ReadStoreOptions = {
  /** Bypass Blob CDN cache (admin writes / review-draft). Default false. */
  bypassCache?: boolean;
};

function resolveLocal(relativePath: StorePath): string {
  return path.join(process.cwd(), relativePath);
}

async function readLocalJson<T>(
  relativePath: StorePath,
  fallback: T,
): Promise<T> {
  try {
    const raw = await fs.readFile(resolveLocal(relativePath), "utf8");
    return JSON.parse(raw) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return fallback;
    throw err;
  }
}

async function readBlobJson<T>(
  relativePath: StorePath,
  bypassCache = false,
): Promise<T | null> {
  const auth = getBlobAuth();
  if (!auth.enabled) return null;

  try {
    const result = await get(relativePath, {
      access: auth.access,
      token: auth.token,
      storeId: auth.storeId,
      // Storefront can use CDN; admin / post-write reads pass bypassCache.
      useCache: !bypassCache,
    });
    if (!result || result.statusCode !== 200 || !result.stream) return null;
    const text = await new Response(result.stream).text();
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export async function readStoreJson<T>(
  relativePath: StorePath,
  fallback: T,
  options?: ReadStoreOptions,
): Promise<T> {
  if (usesBlobStorage()) {
    const fromBlob = await readBlobJson<T>(
      relativePath,
      options?.bypassCache === true,
    );
    if (fromBlob !== null) return fromBlob;
  }
  return readLocalJson(relativePath, fallback);
}

async function writeLocalJson(
  relativePath: StorePath,
  data: unknown,
): Promise<void> {
  const file = resolveLocal(relativePath);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(data, null, 2) + "\n", "utf8");
}

async function writeBlobJson(
  relativePath: StorePath,
  data: unknown,
): Promise<void> {
  const auth = getBlobAuth();
  if (!auth.enabled) {
    throw new Error(
      "Blob storage is not configured. Set BLOB_READ_WRITE_TOKEN and/or BLOB_STORE_ID on Vercel.",
    );
  }

  // Delete-then-put so the same pathname cannot stick on CDN after admin saves.
  try {
    await del(relativePath, {
      token: auth.token,
      storeId: auth.storeId,
    });
  } catch {
    // Missing blob is fine.
  }

  await put(relativePath, JSON.stringify(data, null, 2) + "\n", {
    access: auth.access,
    token: auth.token,
    storeId: auth.storeId,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    // Mutable catalog/CMS JSON must not linger on CDN after overwrite.
    // Vercel minimum is 60s; storefront reads pages with useCache:false.
    cacheControlMaxAge: 60,
  });
}

export class StoreWriteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StoreWriteError";
  }
}

export async function writeStoreJson(
  relativePath: StorePath,
  data: unknown,
): Promise<void> {
  if (usesBlobStorage()) {
    await writeBlobJson(relativePath, data);
    return;
  }

  if (process.env.VERCEL) {
    throw new StoreWriteError(
      "Live admin saves need Vercel Blob. Connect a Blob store and set BLOB_READ_WRITE_TOKEN / BLOB_STORE_ID, then redeploy.",
    );
  }

  await writeLocalJson(relativePath, data);
}

async function deleteLocalJson(relativePath: StorePath): Promise<void> {
  try {
    await fs.unlink(resolveLocal(relativePath));
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return;
    throw err;
  }
}

async function deleteBlobJson(relativePath: StorePath): Promise<void> {
  const auth = getBlobAuth();
  if (!auth.enabled) return;
  try {
    await del(relativePath, {
      token: auth.token,
      storeId: auth.storeId,
    });
  } catch {
    // Missing blob is fine — import/delete races shouldn't fail the admin action.
  }
}

export async function deleteStoreJson(relativePath: StorePath): Promise<void> {
  if (usesBlobStorage()) {
    await deleteBlobJson(relativePath);
    return;
  }
  if (process.env.VERCEL) return;
  await deleteLocalJson(relativePath);
}
