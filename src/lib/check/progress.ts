import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData, CheckProgress } from "@/lib/domain/types";
import type { CheckAnswers } from "./results";

export const CHECK_PROGRESS_VERSION = 1;

export const defaultCheckProgress: CheckProgress = {
  schemaVersion: CHECK_PROGRESS_VERSION,
  index: 0,
  answers: {},
  phase: "intro",
};

export function isPersistedCheckPhase(value: unknown): value is CheckProgress["phase"] {
  return value === "intro" || value === "questions" || value === "result";
}

export function toPersistedCheckPhase(phase: string): CheckProgress["phase"] {
  if (phase === "result") return "result";
  if (phase === "intro") return "intro";
  return "questions";
}

export function fromPersistedCheckPhase(phase: CheckProgress["phase"]): "intro" | "question" | "result" {
  if (phase === "result") return "result";
  if (phase === "intro") return "intro";
  return "question";
}

export function hasCheckProgress(progress: CheckProgress | null | undefined): boolean {
  if (!progress) return false;
  if (progress.phase === "result") return true;
  if (progress.index > 0) return true;
  return Object.keys(progress.answers ?? {}).length > 0;
}

export function normalizeCheckProgress(raw: unknown): CheckProgress {
  if (!raw || typeof raw !== "object") return { ...defaultCheckProgress, answers: {} };
  const value = raw as Partial<CheckProgress> & { answers?: CheckAnswers };
  const answers =
    value.answers && typeof value.answers === "object" && !Array.isArray(value.answers)
      ? { ...value.answers }
      : {};
  const index = typeof value.index === "number" && Number.isFinite(value.index) ? value.index : 0;
  const candidate: CheckProgress = {
    schemaVersion: CHECK_PROGRESS_VERSION,
    index: Math.max(0, Math.floor(index)),
    answers,
    phase: "intro",
  };
  return {
    ...candidate,
    phase: isPersistedCheckPhase(value.phase)
      ? value.phase
      : hasCheckProgress({ ...candidate, index, answers })
        ? "questions"
        : "intro",
    completedAt: typeof value.completedAt === "string" ? value.completedAt : undefined,
  };
}

export function checkStateToProgress(state: {
  index: number;
  answers: CheckAnswers;
  phase: string;
}): CheckProgress {
  const phase = toPersistedCheckPhase(state.phase);
  return {
    schemaVersion: CHECK_PROGRESS_VERSION,
    index: state.index,
    answers: { ...state.answers },
    phase,
    completedAt: phase === "result" ? new Date().toISOString() : undefined,
  };
}

/** Write check progress only — never overwrite folder fields. */
export function mergeCheckProgressIntoFolder(
  existing: AmanahOrdnerData,
  incoming: CheckProgress
): AmanahOrdnerData {
  return {
    ...existing,
    checkProgress: normalizeCheckProgress(incoming),
  };
}

export function emptyFolderWithCheckProgress(incoming: CheckProgress): AmanahOrdnerData {
  return mergeCheckProgressIntoFolder(defaultAmanahData, incoming);
}
