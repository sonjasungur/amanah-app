import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth-utils";
import { getAmanahAIProvider } from "./ai-provider";
import { isAiEnabled, requiresExternalAiConsent } from "./config";
import { minimalDataFromStore } from "./context";
import { checkRateLimit, logAiEvent } from "./rate-limit";
import { enforceAiSafety } from "./safety";
import type { AiFeature } from "./types";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { normalizeData } from "@/lib/domain/migration";

export async function parseAiRequestBody(request: Request): Promise<{ data: AmanahOrdnerData; consentGranted?: boolean }> {
  const body = await request.json().catch(() => ({}));
  const rawData = (body.data ?? body.amanahData) as Partial<AmanahOrdnerData> | undefined;
  const data = rawData ? normalizeData(rawData) : normalizeData({});
  return { data, consentGranted: body.consentGranted === true };
}

export async function handleAiRoute(
  request: Request,
  feature: AiFeature,
  handler: (data: AmanahOrdnerData, body: Record<string, unknown>) => Promise<unknown>,
  preParsedBody?: Record<string, unknown>
) {
  if (!isAiEnabled()) {
    return NextResponse.json({ error: "KI-Funktionen sind deaktiviert." }, { status: 503 });
  }

  const userId = await getAuthenticatedUserId(request);
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rateKey = userId || ip;
  const rate = checkRateLimit(`${feature}:${rateKey}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
  }

  const body = preParsedBody ?? (await request.json().catch(() => ({})));
  const rawData = (body.data ?? body.amanahData) as Partial<AmanahOrdnerData> | undefined;
  const data = rawData ? normalizeData(rawData) : normalizeData({});

  if (requiresExternalAiConsent() && body.consentGranted !== true) {
    return NextResponse.json(
      { error: "Externe KI erfordert deine Einwilligung.", requiresConsent: true },
      { status: 403 }
    );
  }

  const textForSafety = [body.question, body.freeText, body.text, body.prompt].filter(Boolean).join(" ");
  if (textForSafety) {
    const safety = enforceAiSafety(textForSafety, feature);
    if (!safety.allowed) {
      logAiEvent(feature, getAmanahAIProvider().name, true);
      return NextResponse.json({
        blocked: true,
        message: safety.redirectMessage,
        disclaimer: safety.disclaimer,
      });
    }
  }

  const provider = getAmanahAIProvider();
  try {
    const result = await handler(data, body as Record<string, unknown>);
    logAiEvent(feature, provider.name, true);
    return NextResponse.json({ ...result as object, provider: provider.name, disclaimer: "Orientierung — fachliche Prüfung empfohlen." });
  } catch (err) {
    logAiEvent(feature, provider.name, false, err instanceof Error ? err.message : "error");
    return NextResponse.json({ error: "KI-Anfrage fehlgeschlagen." }, { status: 500 });
  }
}

export { minimalDataFromStore };
