import { handleAiRoute } from "@/lib/ai/api-handler";
import { getAmanahAIProvider } from "@/lib/ai/ai-provider";

export async function POST(request: Request) {
  return handleAiRoute(request, "next-question", async (data) => {
    const result = await getAmanahAIProvider().nextQuestion(data);
    return result;
  });
}
