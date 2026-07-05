import type { AmanahAIProvider } from "./types";
import { RuleBasedAIProvider } from "./rule-based-ai-provider";
import { searchKnowledge } from "@/lib/knowledge";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import { DOMAIN_DISCLAIMER } from "./safety";

/** Mock provider — wraps rules + legacy chat for tests/dev without cost */
export class MockAIProvider extends RuleBasedAIProvider implements AmanahAIProvider {
  readonly name = "mock" as const;

  async chat(messages: { role: string; content: string }[], context?: Record<string, unknown>): Promise<string> {
    const last = messages[messages.length - 1]?.content || "";
    const knowledge = searchKnowledge(last);
    if (knowledge.length > 0) {
      const sources = getSourcesByIds(knowledge[0].sourceIds.slice(0, 2));
      return `**${knowledge[0].title}**\n\n${knowledge[0].summary}\n\nQuellen:\n${sources.map((s) => `• ${s.reference}`).join("\n")}\n\n> ${DOMAIN_DISCLAIMER}`;
    }
    if (last.includes("familie") || last.includes("brief")) {
      const data = context?.amanahData as Parameters<MockAIProvider["familyMessage"]>[0] | undefined;
      if (data) {
        const msg = await this.familyMessage(data, "liebevoll");
        return msg.message;
      }
    }
    return `**Amanah-Assistent (Mock)**\n\nIch helfe beim Ordnen, Formulieren und Erkennen offener Punkte.\n\n${DOMAIN_DISCLAIMER}\n\nFrag mich nach der nächsten Frage, einer Mappe-Prüfung oder nutze die neuen Assistent-Funktionen im Dashboard.`;
  }
}

export const mockAIProvider = new MockAIProvider();
