import { NextResponse, type NextRequest } from "next/server";
import { promises as fs } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { optimizeImage } from "@/lib/images/optimizer";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB pre-optimization

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
  const token = process.env.ADMIN_SESSION_TOKEN || "mc-session-v1";
  if (cookie !== token) {
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
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { ok: false, error: "File is larger than 8MB." },
        { status: 400 },
      );
    }

    const original = Buffer.from(await file.arrayBuffer());
    const fallbackExt = EXT_BY_TYPE[file.type] ?? "bin";
    // Skip Sharp for SVG — keep vector.
    const optimized =
      file.type === "image/svg+xml"
        ? { buffer: original, ext: "svg", optimized: false }
        : await optimizeImage(original, fallbackExt);

    const hash = crypto.randomBytes(8).toString("hex");
    const filename = `${Date.now().toString(36)}-${hash}.${optimized.ext}`;
    const dir = path.join(process.cwd(), "public", "uploads", subdir);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, filename), optimized.buffer);

    const url = `/uploads/${subdir}/${filename}`;
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
