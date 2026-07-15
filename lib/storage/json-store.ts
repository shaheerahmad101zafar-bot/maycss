import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { head, put } from "@vercel/blob";

/** Relative path from project root, e.g. `data/products.json`. */
export type StorePath = string;

function blobToken(): string | undefined {
  const token = process.env.BLOB_READ_WRITE_TOKEN?.trim();
  return token || undefined;
}

export function usesBlobStorage(): boolean {
  return Boolean(blobToken());
}

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

async function readBlobJson<T>(relativePath: StorePath): Promise<T | null> {
  const token = blobToken();
  if (!token) return null;

  try {
    const meta = await head(relativePath, { token });
    const res = await fetch(meta.url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function readStoreJson<T>(
  relativePath: StorePath,
  fallback: T,
): Promise<T> {
  if (usesBlobStorage()) {
    const fromBlob = await readBlobJson<T>(relativePath);
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
  const token = blobToken();
  if (!token) {
    throw new Error("BLOB_READ_WRITE_TOKEN is not configured.");
  }

  await put(relativePath, JSON.stringify(data, null, 2) + "\n", {
    access: "public",
    token,
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
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
      "Live admin saves need Vercel Blob storage. In Vercel: Storage → Blob → Create → connect to this project, then redeploy.",
    );
  }

  await writeLocalJson(relativePath, data);
}
