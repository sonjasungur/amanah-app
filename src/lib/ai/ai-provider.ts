import { getAiProviderName, isAiEnabled } from "./config";
import { mockAIProvider } from "./mock-ai-provider";
import { openAIProvider } from "./openai-ai-provider";
import { ruleBasedAIProvider } from "./rule-based-ai-provider";
import type { AmanahAIProvider } from "./types";

let cached: AmanahAIProvider | null = null;

export function getAmanahAIProvider(): AmanahAIProvider {
  if (!isAiEnabled()) return ruleBasedAIProvider;
  if (cached) return cached;
  const name = getAiProviderName();
  if (name === "openai") cached = openAIProvider;
  else if (name === "mock") cached = mockAIProvider;
  else cached = ruleBasedAIProvider;
  return cached;
}

export function resetAmanahAIProvider(): void {
  cached = null;
}

/** @deprecated use getAmanahAIProvider */
export function getAIProvider() {
  const p = getAmanahAIProvider();
  return {
    chat: (messages: { role: string; content: string }[], context?: Record<string, unknown>) =>
      p.chat?.(messages, context) ?? Promise.resolve("AI chat nicht verfügbar."),
  };
}

export type { AIContext } from "./legacy";
