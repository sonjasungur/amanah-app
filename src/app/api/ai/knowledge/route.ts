import { handleAiRoute } from "@/lib/ai/api-handler";
import { getAmanahAIProvider } from "@/lib/ai/ai-provider";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const question = String(body.question || body.text || "").trim();
  if (!question) {
    return NextResponse.json({ error: "Frage erforderlich" }, { status: 400 });
  }
  return handleAiRoute(
    request,
    "knowledge",
    async () => getAmanahAIProvider().knowledge(question),
    body as Record<string, unknown>
  );
}
