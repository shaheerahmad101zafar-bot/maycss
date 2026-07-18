import { NextResponse, type NextRequest } from "next/server";
import crypto from "node:crypto";
import { getSessionToken } from "@/lib/auth-config";
import { optimizeImage } from "@/lib/images/optimizer";
import { saveUploadFile } from "@/lib/storage/upload-store";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/lib/uploads/constants";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "image/svg+xml",
]);

const EXT_BY_TYPE: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/svg+xml": "svg",
};

const CONTENT_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

/**
 * POST /api/admin/upload
 * multipart/form-data with `file` and optional `subdir` (default "qr").
 *
 * If sharp is installed → converts to WebP + resizes to 2000px max.
 * If not → saves original.
 * Admin-gated. Returns { ok, url }.
 */
export async function POST(request: NextRequest) {
  const cookie = request.cookies.get("mc-admin")?.value;
  if (cookie !== getSessionToken()) {
    return NextResponse.json(
      { ok: false, error: "Unauthorised." },
      { status: 401 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const subdir =
      String(formData.get("subdir") ?? "qr").replace(/[^a-z0-9-]/gi, "") ||
      "qr";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "No file received." },
        { status: 400 },
      );
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        {
          ok: false,
          error: "Only PNG, JPEG, WEBP, GIF, or SVG images are allowed.",
        },
        { status: 400 },
      );
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { ok: false, error: `File is larger than ${MAX_UPLOAD_LABEL}.` },
        { status: 400 },
      );
    }

    const original = Buffer.from(await file.arrayBuffer());
    const fallbackExt = EXT_BY_TYPE[file.type] ?? "bin";
    const optimized =
      file.type === "image/svg+xml"
        ? { buffer: original, ext: "svg", optimized: false }
        : await optimizeImage(original, fallbackExt);

    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now().toString(36)}-${hash}.${optimized.ext}`;
    const contentType =
      CONTENT_BY_EXT[optimized.ext] ?? file.type ?? "application/octet-stream";
    const url = await saveUploadFile(
      subdir,
      filename,
      optimized.buffer,
      contentType,
    );

    return NextResponse.json({
      ok: true,
      url,
      optimized: optimized.optimized,
      bytes: optimized.buffer.length,
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        error: err instanceof Error ? err.message : "Upload failed.",
      },
      { status: 500 },
    );
  }
}
