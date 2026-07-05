import { NextResponse } from "next/server";
import { handleGuidedFlowRoute } from "@/lib/guided-flow/api-handler";
import { parseGuidedAnswer } from "@/lib/guided-flow/answer-parser";
import { FLOW_DISCLAIMER } from "@/lib/guided-flow/config";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const questionId = String(body.questionId || "");
  const answer = String(body.answer || body.freeText || "").trim();

  if (!questionId || !answer) {
    return NextResponse.json({ error: "questionId und answer erforderlich" }, { status: 400 });
  }

  return handleGuidedFlowRoute(
    request,
    "parse-answer",
    async ({ data }) => {
      const result = await parseGuidedAnswer(data, questionId, answer, { useAiExtract: true });
      return { ...result, disclaimer: FLOW_DISCLAIMER };
    },
    body as Record<string, unknown>
  );
}
