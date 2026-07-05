import { handleAiRoute } from "@/lib/ai/api-handler";
import { getAmanahAIProvider } from "@/lib/ai/ai-provider";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const freeText = String(body.freeText || body.text || "").trim();
  if (!freeText) {
    return NextResponse.json({ error: "Freitext erforderlich" }, { status: 400 });
  }
  return handleAiRoute(
    request,
    "extract",
    async (data) => getAmanahAIProvider().extract(data, freeText),
    body as Record<string, unknown>
  );
}
