import { handleAiRoute } from "@/lib/ai/api-handler";
import { getAmanahAIProvider } from "@/lib/ai/ai-provider";

export async function POST(request: Request) {
  return handleAiRoute(request, "completion-review", async (data) => {
    return getAmanahAIProvider().completionReview(data);
  });
}
