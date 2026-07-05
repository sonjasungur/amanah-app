import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getAiModelFast, getOpenAiApiKey } from "./config";
import { SYSTEM_PROMPT } from "./prompts";
import { RuleBasedAIProvider } from "./rule-based-ai-provider";
import { mockAIProvider } from "./mock-ai-provider";
import { answerKnowledgeQuestion } from "./knowledge-answer";
import type { AmanahAIProvider, AiProviderName, FamilyMessageTone, KnowledgeResult } from "./types";

export class OpenAIProvider extends RuleBasedAIProvider implements AmanahAIProvider {
  readonly name: AiProviderName = "openai";
  private fallback = new RuleBasedAIProvider();
  private chatFallback = mockAIProvider;

  private async callOpenAI(system: string, user: string): Promise<string | null> {
    const key = getOpenAiApiKey();
    if (!key) return null;
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: getAiModelFast(),
          messages: [{ role: "system", content: system }, { role: "user", content: user }],
          temperature: 0.4,
          max_tokens: 600,
        }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? null;
    } catch {
      return null;
    }
  }

  async familyMessage(data: AmanahOrdnerData, tone: FamilyMessageTone) {
    const base = await this.fallback.familyMessage(data, tone);
    const enhanced = await this.callOpenAI(
      SYSTEM_PROMPT + "\n" + "Formuliere einen Familienentwurf. Keine Rechtsberatung.",
      `Verbessere stilistisch (Ton: ${tone}), behalte Inhalt:\n${base.message}`
    );
    return enhanced ? { ...base, message: enhanced } : base;
  }

  async knowledge(question: string): Promise<KnowledgeResult> {
    return answerKnowledgeQuestion(question, { useOpenAI: !!getOpenAiApiKey() });
  }

  async chat(messages: { role: string; content: string }[], _context?: Record<string, unknown>): Promise<string> {
    const key = getOpenAiApiKey();
    if (!key) return this.chatFallback.chat!(messages, _context);
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model: getAiModelFast(),
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages.slice(-6)],
          temperature: 0.5,
          max_tokens: 800,
        }),
      });
      if (!res.ok) return this.chatFallback.chat!(messages, _context);
      const data = await res.json();
      return data.choices?.[0]?.message?.content || (await this.chatFallback.chat!(messages, _context));
    } catch {
      return this.chatFallback.chat!(messages, _context);
    }
  }
}

export const openAIProvider = new OpenAIProvider();
