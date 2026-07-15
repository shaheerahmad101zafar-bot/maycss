import "server-only";

import { promises as fs } from "node:fs";
import path from "node:path";
import { put } from "@vercel/blob";
import { usesBlobStorage } from "./json-store";

export async function saveUploadFile(
  subdir: string,
  filename: string,
  buffer: Buffer,
  contentType: string,
): Promise<string> {
  const safeSubdir = subdir.replace(/[^a-z0-9-]/gi, "") || "misc";
  const pathname = `uploads/${safeSubdir}/${filename}`;

  if (usesBlobStorage()) {
    const token = process.env.BLOB_READ_WRITE_TOKEN!.trim();
    const blob = await put(pathname, buffer, {
      access: "public",
      token,
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType,
    });
    return blob.url;
  }

  if (process.env.VERCEL) {
    throw new Error(
      "Image uploads on the live site need Vercel Blob storage. Connect Blob in Vercel Storage settings and redeploy.",
    );
  }

  const dir = path.join(process.cwd(), "public", "uploads", safeSubdir);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), buffer);
  return `/uploads/${safeSubdir}/${filename}`;
}
