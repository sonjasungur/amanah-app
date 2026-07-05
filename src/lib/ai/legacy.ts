/** Legacy types for backward compatibility */
import type { AmanahOrdnerData } from "@/lib/types";

export interface AIContext {
  amanahData?: Partial<AmanahOrdnerData>;
  knowledgeQuery?: string;
  task?: "guide" | "family_letter" | "summary" | "translate" | "culture" | "testament" | "open_points";
  targetLanguage?: string;
}

export interface AIProvider {
  chat(messages: { role: "user" | "assistant" | "system"; content: string }[], context?: AIContext): Promise<string>;
}
