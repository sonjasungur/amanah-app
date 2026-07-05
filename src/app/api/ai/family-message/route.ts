import { handleAiRoute } from "@/lib/ai/api-handler";
import { getAmanahAIProvider } from "@/lib/ai/ai-provider";
import type { FamilyMessageTone } from "@/lib/ai/types";

export async function POST(request: Request) {
  return handleAiRoute(request, "family-message", async (data, body) => {
    const tone = (body.tone as FamilyMessageTone) || "liebevoll";
    return getAmanahAIProvider().familyMessage(data, tone);
  });
}
