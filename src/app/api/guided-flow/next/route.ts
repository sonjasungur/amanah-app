import { handleGuidedFlowRoute } from "@/lib/guided-flow/api-handler";
import { getNextGuidedQuestion } from "@/lib/guided-flow/flow-engine";
import { FLOW_DISCLAIMER } from "@/lib/guided-flow/config";

export async function POST(request: Request) {
  return handleGuidedFlowRoute(request, "next", async ({ data, skippedQuestions, completedQuestions }) => {
    const result = getNextGuidedQuestion(data, skippedQuestions, completedQuestions);
    return { ...result, disclaimer: FLOW_DISCLAIMER };
  });
}
