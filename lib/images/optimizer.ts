import "server-only";

/**
 * ImageOptimizer — optional Sharp-backed WebP converter.
 *
 * If `sharp` is installed, uploaded images are:
 *   - Converted to WebP
 *   - Resized down to a max of 2000px on the longest edge
 *   - Stripped of EXIF metadata (privacy + size)
 *
 * If Sharp is NOT installed, the buffer passes through unchanged with the
 * original extension so the app keeps working. Enable optimization with:
 *
 *     npm install sharp
 */

type OptimizedImage = {
  buffer: Buffer;
  ext: string;
  optimized: boolean;
  width?: number;
  height?: number;
};

let sharpModule: typeof import("sharp") | null | undefined;
async function loadSharp() {
  if (sharpModule !== undefined) return sharpModule;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = (await import("sharp")) as any;
    sharpModule = (mod.default ?? mod) as typeof import("sharp");
  } catch {
    sharpModule = null;
  }
  return sharpModule;
}

export async function optimizeImage(
  input: Buffer,
  fallbackExt: string,
): Promise<OptimizedImage> {
  const sharp = await loadSharp();
  if (!sharp) {
    return { buffer: input, ext: fallbackExt, optimized: false };
  }
  try {
    const image = sharp(input, { failOn: "none" }).rotate();
    const metadata = await image.metadata();
    const longest = Math.max(metadata.width ?? 0, metadata.height ?? 0);
    if (longest > 2000) image.resize({ width: 2000, height: 2000, fit: "inside" });
    const buffer = await image.webp({ quality: 82 }).toBuffer();
    return {
      buffer,
      ext: "webp",
      optimized: true,
      width: metadata.width,
      height: metadata.height,
    };
  } catch (err) {
    console.warn("[image-optimizer] sharp failed, passing through", err);
    return { buffer: input, ext: fallbackExt, optimized: false };
  }
}
