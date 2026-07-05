import { NextResponse } from "next/server";
import { getAmanahAIProvider } from "@/lib/ai/ai-provider";
import { getAiProviderName, isAiEnabled, requiresExternalAiConsent } from "@/lib/ai/config";
import { enforceAiSafety } from "@/lib/ai/safety";
import { checkRateLimit, logAiEvent } from "@/lib/ai/rate-limit";

export async function POST(request: Request) {
  try {
    if (!isAiEnabled()) {
      return NextResponse.json({ error: "KI deaktiviert" }, { status: 503 });
    }

    const ip = request.headers.get("x-forwarded-for") || "local";
    const rate = checkRateLimit(`chat:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Rate limit" }, { status: 429 });
    }

    const body = await request.json();
    const { messages, context, consentGranted } = body as {
      messages: { role: string; content: string }[];
      context?: Record<string, unknown>;
      consentGranted?: boolean;
    };

    if (!messages?.length) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    if (requiresExternalAiConsent() && consentGranted !== true) {
      return NextResponse.json({ error: "Consent required", requiresConsent: true }, { status: 403 });
    }

    const last = messages[messages.length - 1]?.content || "";
    const safety = enforceAiSafety(last, "knowledge");
    if (!safety.allowed) {
      logAiEvent("chat", getAmanahAIProvider().name, true);
      return NextResponse.json({ response: safety.redirectMessage, provider: getAiProviderName(), blocked: true });
    }

    const provider = getAmanahAIProvider();
    const response = provider.chat
      ? await provider.chat(messages, context)
      : "Chat nicht verfügbar — nutze die Assistent-Funktionen im Dashboard.";
    logAiEvent("chat", provider.name, true);
    return NextResponse.json({ response, provider: provider.name });
  } catch {
    logAiEvent("chat", getAiProviderName(), false, "chat error");
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
