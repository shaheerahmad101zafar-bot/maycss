import { NextResponse, type NextRequest } from "next/server";
import { SupportEngine } from "@/lib/chat/storage";

/**
 * GET /api/chat/inbox — admin polls this to refresh the thread list.
 * Middleware already gates /admin, but this endpoint sits at /api so we
 * check the admin cookie manually before responding.
 */
export async function GET(request: NextRequest) {
  const cookie = request.cookies.get("mc-admin")?.value;
  const token = process.env.ADMIN_SESSION_TOKEN || "mc-session-v1";
  if (cookie !== token) {
    return NextResponse.json({ ok: false, error: "Unauthorised." }, { status: 401 });
  }
  const threads = await SupportEngine.listActive();
  return NextResponse.json({ ok: true, threads });
}
