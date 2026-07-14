import { NextResponse, type NextRequest } from "next/server";
import { AiHumanizer } from "@/lib/ai/humanizer";

/**
 * POST /api/admin/humanize
 * Body: { text: string, keywords?: string[] }
 * Returns: { ok: true, text: string }
 *
 * Admin-gated. Uses the rules-based AiHumanizer for now. Swap the body
 * for an LLM call (GPT-4 / Claude) when you have an API key.
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
    const body = (await request.json()) as {
      text?: string;
      keywords?: string[];
    };
    const text = String(body.text ?? "").trim();
    if (!text) {
      return NextResponse.json(
        { ok: false, error: "Text is required." },
        { status: 400 },
      );
    }
    const humanized = AiHumanizer.humanize(text, {
      keywords: Array.isArray(body.keywords) ? body.keywords : undefined,
    });
    return NextResponse.json({ ok: true, text: humanized });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "failed" },
      { status: 500 },
    );
  }
}
