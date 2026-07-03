import type { AIProvider, AIContext } from "./provider";
import type { AIMessage } from "@/lib/types";
import { MockAIProvider } from "./mock-provider";

export class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private fallback: MockAIProvider;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || "";
    this.model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    this.fallback = new MockAIProvider();
  }

  async chat(messages: AIMessage[], context?: AIContext): Promise<string> {
    if (!this.apiKey) return this.fallback.chat(messages, context);

    const systemPrompt = `Du bist der Amanah-Assistent für AmanahOrdner — eine islamische Vorsorgeplattform für Muslime in Deutschland.
REGELN:
- Keine Fatwa, keine Rechtsberatung, keine medizinische Beratung
- Bei islamischen Fragen nur geprüfte Inhalte, immer Quellen nennen
- Bei Unsicherheit: "Das muss mit Imam/Gelehrten geprüft werden."
- Ruhiger, respektvoller Ton
- Antwortformat bei islamischen Fragen: Kurze Antwort, Islamische Grundlage, Quellen, Meinungsunterschiede, Praktische Schritte, Hinweis Imam/Gelehrte`;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages,
          ],
          temperature: 0.7,
          max_tokens: 1500,
        }),
      });

      if (!response.ok) throw new Error("OpenAI API error");
      const data = await response.json();
      return data.choices[0]?.message?.content || "Keine Antwort erhalten.";
    } catch {
      return this.fallback.chat(messages, context);
    }
  }
}
