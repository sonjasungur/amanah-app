import { NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/server/auth-utils";
import { checkRateLimit } from "@/lib/ai/rate-limit";
import { normalizeData } from "@/lib/domain/migration";
import type { AmanahOrdnerData } from "@/lib/domain/types";

export async function parseGuidedFlowBody(request: Request, preParsed?: Record<string, unknown>) {
  const body = preParsed ?? (await request.json().catch(() => ({})));
  const rawData = (body.data ?? body.amanahData) as Partial<AmanahOrdnerData> | undefined;
  const data = rawData ? normalizeData(rawData) : normalizeData({});
  const skippedQuestions = Array.isArray(body.skippedQuestions) ? (body.skippedQuestions as string[]) : [];
  const completedQuestions = Array.isArray(body.completedQuestions) ? (body.completedQuestions as string[]) : [];
  return { body, data, skippedQuestions, completedQuestions };
}

export async function handleGuidedFlowRoute(
  request: Request,
  feature: string,
  handler: (ctx: {
    data: AmanahOrdnerData;
    body: Record<string, unknown>;
    skippedQuestions: string[];
    completedQuestions: string[];
  }) => Promise<unknown>,
  preParsedBody?: Record<string, unknown>
) {
  const userId = await getAuthenticatedUserId(request);
  const ip = request.headers.get("x-forwarded-for") || "local";
  const rate = checkRateLimit(`guided-flow:${feature}:${userId || ip}`);
  if (!rate.allowed) {
    return NextResponse.json({ error: "Zu viele Anfragen. Bitte kurz warten." }, { status: 429 });
  }

  try {
    const { body, data, skippedQuestions, completedQuestions } = await parseGuidedFlowBody(
      request,
      preParsedBody
    );
    const result = await handler({ data, body, skippedQuestions, completedQuestions });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Anfrage fehlgeschlagen." },
      { status: 400 }
    );
  }
}
