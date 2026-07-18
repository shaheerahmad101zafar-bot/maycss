import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "./constants";

export type UploadResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export function isStoredUploadUrl(value: string): boolean {
  if (!value) return false;
  if (value.startsWith("/uploads/")) return true;
  return /\.blob\.vercel-storage\.com\//i.test(value);
}

/** Compress large photos in the browser so they pass Vercel's body-size limit. */
export async function prepareImageFileForUpload(file: File): Promise<File> {
  if (file.type === "image/svg+xml") {
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(`SVG must be under ${MAX_UPLOAD_LABEL}.`);
    }
    return file;
  }

  if (file.size <= MAX_UPLOAD_BYTES && file.type === "image/webp") {
    return file;
  }

  const bitmap = await createImageBitmap(file);
  const maxEdge = 2200;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error(
        `Image is too large (${MAX_UPLOAD_LABEL} max). Paste an external URL instead.`,
      );
    }
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.86;
  let blob = await canvasToBlob(canvas, "image/webp", quality);
  while (blob.size > MAX_UPLOAD_BYTES && quality > 0.45) {
    quality -= 0.08;
    blob = await canvasToBlob(canvas, "image/webp", quality);
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    blob = await canvasToBlob(canvas, "image/jpeg", 0.72);
  }
  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new Error(
      `Could not compress below ${MAX_UPLOAD_LABEL}. Use External URL instead.`,
    );
  }

  const base = file.name.replace(/\.[^.]+$/, "") || "upload";
  return new File([blob], `${base}.webp`, { type: blob.type });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Compression failed."))),
      type,
      quality,
    );
  });
}

export async function postAdminUpload(
  file: File,
  subdir: string,
): Promise<UploadResult> {
  if (!file.type.startsWith("image/")) {
    return { ok: false, error: "Please choose an image file." };
  }

  let prepared: File;
  try {
    prepared = await prepareImageFileForUpload(file);
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Could not prepare image.",
    };
  }

  const fd = new FormData();
  fd.append("file", prepared);
  fd.append("subdir", subdir);

  let res: Response;
  try {
    res = await fetch("/api/admin/upload", { method: "POST", body: fd });
  } catch {
    return { ok: false, error: "Network error while uploading." };
  }

  const raw = await res.text();
  let data: { ok?: boolean; url?: string; error?: string };
  try {
    data = JSON.parse(raw) as { ok?: boolean; url?: string; error?: string };
  } catch {
    if (res.status === 413 || /request entity too large/i.test(raw)) {
      return {
        ok: false,
        error: `File too large for server upload (max ${MAX_UPLOAD_LABEL}). Try a smaller image or use External URL.`,
      };
    }
    if (res.status === 401) {
      return { ok: false, error: "Session expired — sign in to admin again." };
    }
    return {
      ok: false,
      error: raw.slice(0, 160) || `Upload failed (${res.status}).`,
    };
  }

  if (data.ok && data.url) return { ok: true, url: data.url };
  return { ok: false, error: data.error || "Upload failed." };
}
