import { NextResponse, type NextRequest } from "next/server";
import { SupportEngine } from "@/lib/chat/storage";

/** POST /api/chat/thread — customer opens a new thread. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      name?: string;
      body?: string;
    };
    if (!body.email || !body.name || !body.body) {
      return NextResponse.json(
        { ok: false, error: "email, name and body are required." },
        { status: 400 },
      );
    }
    const thread = await SupportEngine.openThread({
      email: body.email,
      name: body.name,
      body: body.body,
    });
    return NextResponse.json({ ok: true, thread });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
