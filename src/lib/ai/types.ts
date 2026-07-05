import type { AmanahOrdnerData, ModuleId } from "@/lib/domain/types";

export type AiProviderName = "mock" | "rules" | "openai";

export type AiFeature =
  | "next-question"
  | "completion-review"
  | "extract"
  | "family-message"
  | "knowledge"
  | "chat";

export type UserIntent =
  | "general"
  | "organize"
  | "formulate"
  | "summarize"
  | "legal"
  | "medical"
  | "fatwa"
  | "inheritance_calculation"
  | "validity"
  | "diagnosis"
  | "treatment"
  | "blocked";

export type FamilyMessageTone = "liebevoll" | "sachlich" | "kurz" | "ausfuehrlich";

export interface SafetyResult {
  allowed: boolean;
  intent: UserIntent;
  redirectMessage?: string;
  disclaimer: string;
}

export interface NextQuestionResult {
  question: string;
  moduleId: ModuleId | "pdf";
  fieldPath: string;
  reason: string;
  disclaimer: string;
}

export interface CompletionReviewItem {
  label: string;
  moduleId?: ModuleId;
  fieldPath?: string;
}

export interface CompletionReviewResult {
  critical: CompletionReviewItem[];
  recommended: CompletionReviewItem[];
  optional: CompletionReviewItem[];
  summary: string;
  disclaimer: string;
}

export interface ExtractSuggestion {
  fieldPath: string;
  value: unknown;
  confidence: "high" | "medium" | "low";
  label: string;
}

export interface ExtractResult {
  suggestedUpdates: ExtractSuggestion[];
  clarificationNeeded: string[];
  previewNote: string;
  disclaimer: string;
}

export interface FamilyMessageResult {
  message: string;
  tone: FamilyMessageTone;
  disclaimer: string;
}

export interface KnowledgeCitation {
  entryId: string;
  title: string;
  category: string;
  sourceLabel: string;
  sourceUrl?: string;
  reviewedStatus: string;
  orientationNote?: string;
}

export interface KnowledgeResult {
  answer: string;
  citations?: KnowledgeCitation[];
  usedEntryIds?: string[];
  safetyLevel?: "general_allowed" | "legal_sensitive" | "medical_sensitive" | "religious_sensitive";
  blocked: boolean;
  noSource?: boolean;
  suggestedNextStep?: string;
  sources?: string[];
  disclaimer: string;
}

export interface AmanahAIProvider {
  readonly name: AiProviderName;
  nextQuestion(data: AmanahOrdnerData): Promise<NextQuestionResult>;
  completionReview(data: AmanahOrdnerData): Promise<CompletionReviewResult>;
  extract(data: AmanahOrdnerData, freeText: string): Promise<ExtractResult>;
  familyMessage(data: AmanahOrdnerData, tone: FamilyMessageTone): Promise<FamilyMessageResult>;
  knowledge(question: string): Promise<KnowledgeResult>;
  chat?(messages: { role: string; content: string }[], context?: Record<string, unknown>): Promise<string>;
}

export interface AiRequestContext {
  data: AmanahOrdnerData;
  userId?: string;
  ip?: string;
}

export interface AiEventLogEntry {
  feature: AiFeature;
  provider: AiProviderName;
  createdAt: string;
  success: boolean;
  error?: string;
}
