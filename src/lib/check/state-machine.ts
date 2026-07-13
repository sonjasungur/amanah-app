import { CHECK_QUESTIONS, CHECK_TOTAL } from "./questions";
import type { CheckAnswers } from "./results";

export type CheckPhase = "loading" | "intro" | "question" | "saving" | "result" | "error";

export interface CheckState {
  phase: CheckPhase;
  index: number;
  answers: CheckAnswers;
  error: string | null;
  hydrated: boolean;
}

export type CheckAction =
  | { type: "HYDRATE_START" }
  | { type: "HYDRATE_DONE"; state: Partial<CheckState> }
  | { type: "HYDRATE_FAIL"; error: string }
  | { type: "START" }
  | { type: "ANSWER"; value: boolean }
  | { type: "BACK" }
  | { type: "SAVE_DONE"; nextIndex: number }
  | { type: "RESET" }
  | { type: "RETRY" }
  | { type: "SET_ERROR"; error: string };

export const CHECK_STORAGE_KEY = "amanah-check-progress-v3";

export const INITIAL_CHECK_STATE: CheckState = {
  phase: "loading",
  index: 0,
  answers: {},
  error: null,
  hydrated: false,
};

export function checkReducer(state: CheckState, action: CheckAction): CheckState {
  switch (action.type) {
    case "HYDRATE_START":
      return { ...state, phase: "loading", error: null };
    case "HYDRATE_DONE": {
      const hasProgress =
        (action.state.answers && Object.keys(action.state.answers).length > 0) ||
        (typeof action.state.index === "number" && action.state.index > 0);
      const phase =
        action.state.phase === "result"
          ? "result"
          : hasProgress
            ? "intro"
            : "intro";
      return {
        ...state,
        index: action.state.index ?? 0,
        answers: action.state.answers ?? {},
        phase,
        hydrated: true,
        error: null,
      };
    }
    case "HYDRATE_FAIL":
      return { ...INITIAL_CHECK_STATE, phase: "error", hydrated: true, error: action.error };
    case "START":
      return { ...state, phase: "question", index: 0, error: null };
    case "ANSWER": {
      const q = CHECK_QUESTIONS[state.index];
      if (!q) return { ...state, phase: "error", error: "Frage nicht gefunden. Bitte neu starten." };
      return {
        ...state,
        phase: "saving",
        answers: { ...state.answers, [q.id]: action.value },
        error: null,
      };
    }
    case "SAVE_DONE": {
      if (action.nextIndex >= CHECK_TOTAL) {
        return { ...state, phase: "result", index: CHECK_TOTAL, error: null };
      }
      return { ...state, phase: "question", index: action.nextIndex, error: null };
    }
    case "BACK": {
      if (state.index <= 0) return { ...state, phase: "intro", index: 0 };
      return { ...state, phase: "question", index: state.index - 1, error: null };
    }
    case "RESET":
      return { ...INITIAL_CHECK_STATE, phase: "intro", hydrated: true };
    case "RETRY":
      return { ...state, phase: state.index > 0 || Object.keys(state.answers).length > 0 ? "question" : "intro", error: null };
    case "SET_ERROR":
      return { ...state, phase: "error", error: action.error };
    default:
      return state;
  }
}

export function loadCheckState(): { ok: true; data: Pick<CheckState, "index" | "answers" | "phase"> } | { ok: false; error: string } {
  if (typeof window === "undefined") return { ok: false, error: "Nur im Browser verfügbar." };
  try {
    const raw = sessionStorage.getItem(CHECK_STORAGE_KEY);
    if (!raw) return { ok: true, data: { index: 0, answers: {}, phase: "intro" as const } };
    const parsed = JSON.parse(raw) as { index?: number; answers?: CheckAnswers; phase?: string };
    const index = typeof parsed.index === "number" ? parsed.index : 0;
    const answers = parsed.answers && typeof parsed.answers === "object" ? parsed.answers : {};
    if (index < 0 || index > CHECK_TOTAL) return { ok: false, error: "Gespeicherter Fortschritt ist ungültig." };
    const phase = parsed.phase === "result" ? "result" : index > 0 ? "question" : "intro";
    return { ok: true, data: { index, answers, phase } };
  } catch {
    return { ok: false, error: "Gespeicherter Fortschritt konnte nicht gelesen werden." };
  }
}

export function persistCheckState(state: CheckState): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      CHECK_STORAGE_KEY,
      JSON.stringify({
        index: state.index,
        answers: state.answers,
        phase: state.phase === "result" ? "result" : "questions",
      })
    );
  } catch {
    // quota or private mode — non-fatal
  }
}

export function clearCheckState(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(CHECK_STORAGE_KEY);
}
