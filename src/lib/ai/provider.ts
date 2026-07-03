import type { AIMessage } from "@/lib/types";
import type { AmanahOrdnerData } from "@/lib/types";

export interface AIProvider {
  chat(messages: AIMessage[], context?: AIContext): Promise<string>;
}

export interface AIContext {
  amanahData?: Partial<AmanahOrdnerData>;
  knowledgeQuery?: string;
  task?: "guide" | "family_letter" | "summary" | "translate" | "culture" | "testament" | "open_points";
  targetLanguage?: string;
}

export function getAIProvider(): AIProvider {
  const provider = process.env.AI_PROVIDER || "mock";
  if (provider === "openai" && process.env.OPENAI_API_KEY) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { OpenAIProvider } = require("./openai-provider");
    return new OpenAIProvider();
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MockAIProvider } = require("./mock-provider");
  return new MockAIProvider();
}
