import { NextResponse, type NextRequest } from "next/server";
import { SupportEngine } from "@/lib/chat/storage";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/chat/thread/[id] — customer or admin polls for the latest state. */
export async function GET(_req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  const thread = await SupportEngine.getThread(id);
  if (!thread) {
    return NextResponse.json(
      { ok: false, error: "Thread not found." },
      { status: 404 },
    );
  }
  return NextResponse.json({ ok: true, thread });
}

/** POST /api/chat/thread/[id] — post a message from customer or admin. */
export async function POST(req: NextRequest, { params }: Ctx) {
  const { id } = await params;
  try {
    const body = (await req.json()) as { from?: string; body?: string };
    if (
      !body.body ||
      (body.from !== "customer" && body.from !== "admin")
    ) {
      return NextResponse.json(
        { ok: false, error: "from and body are required." },
        { status: 400 },
      );
    }
    const msg = await SupportEngine.append({
      threadId: id,
      from: body.from,
      body: body.body,
    });
    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
