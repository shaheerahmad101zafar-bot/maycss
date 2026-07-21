import { revalidatePath, revalidateTag, updateTag } from "next/cache";
import { NextResponse } from "next/server";

/**
 * On-demand CMS cache bust after blob sync / external content updates.
 * POST with header x-revalidate-secret: REVALIDATE_SECRET
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "REVALIDATE_SECRET not configured" },
      { status: 503 },
    );
  }
  const provided = req.headers.get("x-revalidate-secret")?.trim();
  if (!provided || provided !== secret) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let paths: string[] = ["/", "/sale", "/shop", "/about", "/contact"];
  try {
    const body = (await req.json()) as { paths?: string[] };
    if (Array.isArray(body.paths) && body.paths.length > 0) {
      paths = body.paths.filter((p) => typeof p === "string" && p.startsWith("/"));
    }
  } catch {
    // optional body
  }

  updateTag("cms-pages");
  revalidateTag("cms-pages", "max");
  for (const path of paths) {
    revalidatePath(path);
  }
  revalidatePath("/", "layout");

  return NextResponse.json({ ok: true, paths, tag: "cms-pages" });
}
