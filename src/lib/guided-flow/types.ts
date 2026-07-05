import type { ModuleId } from "@/lib/domain/types";

export type FlowMode = "idle" | "paused" | "asking" | "reviewing" | "saved" | "skipped" | "done";

export type ExpectedAnswerType =
  | "text"
  | "phone"
  | "person"
  | "boolean"
  | "location"
  | "freeform";

export type QuestionSensitivity = "low" | "medium" | "high";

export type UpdateConfidence = "high" | "medium" | "low";

export interface GuidedQuestion {
  id: string;
  moduleId: ModuleId;
  fieldPath: string;
  questionText: string;
  helpText: string;
  sensitivity: QuestionSensitivity;
  expectedAnswerType: ExpectedAnswerType;
  canSkip: boolean;
  priority: number;
  critical: boolean;
  safetyNotice?: string;
}

export interface SuggestedUpdate {
  fieldPath: string;
  label: string;
  value: unknown;
  confidence: UpdateConfidence;
  moduleId: ModuleId;
}

export interface PatchPreviewItem {
  fieldPath: string;
  label: string;
  moduleId: ModuleId;
  oldValue: unknown;
  newValue: unknown;
  confidence: UpdateConfidence;
  status: "safe" | "uncertain" | "needs_clarification";
}

export interface GuidedFlowState {
  currentQuestionId: string | null;
  answerDraft: string;
  suggestedUpdates: SuggestedUpdate[];
  clarificationNeeded: string[];
  skippedQuestions: string[];
  completedQuestions: string[];
  flowMode: FlowMode;
  error: string | null;
  lastSavedAt: string | null;
}

export interface FlowProgress {
  total: number;
  completed: number;
  skipped: number;
  remaining: number;
  criticalTotal: number;
  criticalCompleted: number;
  percent: number;
  allCriticalDone: boolean;
}

export interface NextQuestionResponse {
  question: GuidedQuestion | null;
  flowProgress: FlowProgress;
  done: boolean;
  message?: string;
}

export interface ParseAnswerResponse {
  suggestedUpdates: SuggestedUpdate[];
  clarificationNeeded: string[];
  previewItems: PatchPreviewItem[];
  blocked?: boolean;
  message?: string;
}

export interface ApplyUpdatesResponse {
  data: import("@/lib/domain/types").AmanahOrdnerData;
  applied: string[];
  rejected: string[];
}
