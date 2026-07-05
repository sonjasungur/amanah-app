"use client";

import { useCallback, useEffect, useState } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { GUIDED_FLOW_STORAGE_KEY } from "@/lib/guided-flow/config";
import type {
  FlowMode,
  FlowProgress,
  GuidedFlowState,
  GuidedQuestion,
  PatchPreviewItem,
  SuggestedUpdate,
} from "@/lib/guided-flow/types";

const DEFAULT_STATE: GuidedFlowState = {
  currentQuestionId: null,
  answerDraft: "",
  suggestedUpdates: [],
  clarificationNeeded: [],
  skippedQuestions: [],
  completedQuestions: [],
  flowMode: "idle",
  error: null,
  lastSavedAt: null,
};

function loadPersistedState(): Partial<GuidedFlowState> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(GUIDED_FLOW_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Partial<GuidedFlowState>;
  } catch {
    return {};
  }
}

function persistState(state: GuidedFlowState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    GUIDED_FLOW_STORAGE_KEY,
    JSON.stringify({
      skippedQuestions: state.skippedQuestions,
      completedQuestions: state.completedQuestions,
      currentQuestionId: state.currentQuestionId,
      flowMode: state.flowMode,
      lastSavedAt: state.lastSavedAt,
    })
  );
}

export function useGuidedFlow() {
  const store = useAmanahStore();
  const [state, setState] = useState<GuidedFlowState>({ ...DEFAULT_STATE, ...loadPersistedState() });
  const [currentQuestion, setCurrentQuestion] = useState<GuidedQuestion | null>(null);
  const [flowProgress, setFlowProgress] = useState<FlowProgress | null>(null);
  const [previewItems, setPreviewItems] = useState<PatchPreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const postFlow = useCallback(
    async (path: string, extra: Record<string, unknown> = {}) => {
      const data = pickDataFields(store);
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          skippedQuestions: state.skippedQuestions,
          completedQuestions: state.completedQuestions,
          ...extra,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Fehler");
      return json;
    },
    [store, state.skippedQuestions, state.completedQuestions]
  );

  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    setSuccessMessage(null);
    try {
      const r = await postFlow("/api/guided-flow/next");
      setCurrentQuestion(r.question);
      setFlowProgress(r.flowProgress);
      if (r.done) {
        setState((s) => {
          const next = { ...s, flowMode: "done" as FlowMode, currentQuestionId: null };
          persistState(next);
          return next;
        });
      } else if (r.question) {
        setState((s) => {
          const next = {
            ...s,
            flowMode: "asking" as FlowMode,
            currentQuestionId: r.question.id,
            answerDraft: "",
            suggestedUpdates: [],
            clarificationNeeded: [],
            error: null,
          };
          persistState(next);
          return next;
        });
      }
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler", flowMode: "idle" }));
    }
    setLoading(false);
  }, [postFlow]);

  const parseAnswer = useCallback(async () => {
    if (!currentQuestion || !state.answerDraft.trim()) return;
    setLoading(true);
    setSuccessMessage(null);
    try {
      const r = await postFlow("/api/guided-flow/parse-answer", {
        questionId: currentQuestion.id,
        answer: state.answerDraft,
      });
      if (r.blocked) {
        setState((s) => ({
          ...s,
          error: r.message,
          clarificationNeeded: r.clarificationNeeded ?? [],
          flowMode: "asking",
        }));
        setPreviewItems([]);
      } else {
        setState((s) => ({
          ...s,
          suggestedUpdates: r.suggestedUpdates ?? [],
          clarificationNeeded: r.clarificationNeeded ?? [],
          flowMode: "reviewing",
          error: null,
        }));
        setPreviewItems(r.previewItems ?? []);
      }
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler" }));
    }
    setLoading(false);
  }, [currentQuestion, state.answerDraft, postFlow]);

  const applyUpdates = useCallback(
    async (updates: SuggestedUpdate[], overwrite = false) => {
      if (!currentQuestion) return;
      setLoading(true);
      const newCompleted = [...new Set([...state.completedQuestions, currentQuestion.id])];
      try {
        const data = pickDataFields(store);
        const res = await fetch("/api/guided-flow/apply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            confirmedUpdates: updates,
            overwrite,
            skippedQuestions: state.skippedQuestions,
            completedQuestions: newCompleted,
          }),
        });
        const r = await res.json();
        if (!res.ok) throw new Error(r.error || "Fehler");
        store.importData(r.data);
        setState((s) => {
          const next = {
            ...s,
            flowMode: "saved" as FlowMode,
            suggestedUpdates: [],
            clarificationNeeded: [],
            answerDraft: "",
            completedQuestions: newCompleted,
            lastSavedAt: new Date().toISOString(),
            error: null,
          };
          persistState(next);
          return next;
        });
        setPreviewItems([]);
        setSuccessMessage("Angaben übernommen.");

        const nextRes = await fetch("/api/guided-flow/next", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: r.data,
            skippedQuestions: state.skippedQuestions,
            completedQuestions: newCompleted,
          }),
        });
        const next = await nextRes.json();
        setCurrentQuestion(next.question);
        setFlowProgress(next.flowProgress);
        if (next.done) {
          setState((s) => ({ ...s, flowMode: "done", currentQuestionId: null }));
        } else if (next.question) {
          setState((s) => ({
            ...s,
            flowMode: "asking",
            currentQuestionId: next.question.id,
            answerDraft: "",
          }));
        }
      } catch (e) {
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler" }));
      }
      setLoading(false);
    },
    [store, currentQuestion, state.skippedQuestions, state.completedQuestions]
  );

  const skipQuestion = useCallback(async () => {
    if (!currentQuestion) return;
    const newSkipped = [...new Set([...state.skippedQuestions, currentQuestion.id])];
    setState((s) => {
      const next = {
        ...s,
        skippedQuestions: newSkipped,
        answerDraft: "",
        suggestedUpdates: [],
        clarificationNeeded: [],
        flowMode: "skipped" as FlowMode,
        error: null,
      };
      persistState(next);
      return next;
    });
    setPreviewItems([]);
    setLoading(true);
    try {
      const data = pickDataFields(store);
      const res = await fetch("/api/guided-flow/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data,
          skippedQuestions: newSkipped,
          completedQuestions: state.completedQuestions,
        }),
      });
      const r = await res.json();
      setCurrentQuestion(r.question);
      setFlowProgress(r.flowProgress);
      if (r.done) {
        setState((s) => ({ ...s, flowMode: "done", currentQuestionId: null }));
      } else if (r.question) {
        setState((s) => ({
          ...s,
          flowMode: "asking",
          currentQuestionId: r.question.id,
          answerDraft: "",
        }));
      }
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler" }));
    }
    setLoading(false);
  }, [currentQuestion, state.skippedQuestions, state.completedQuestions, store]);

  const discardPreview = useCallback(() => {
    setState((s) => ({
      ...s,
      suggestedUpdates: [],
      clarificationNeeded: [],
      flowMode: "asking",
    }));
    setPreviewItems([]);
  }, []);

  const pauseFlow = useCallback(() => {
    setState((s) => {
      const next = { ...s, flowMode: "idle" as FlowMode };
      persistState(next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (state.flowMode === "idle" && !currentQuestion && !loading) {
      loadNextQuestion();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- initial load only

  return {
    state,
    setState,
    currentQuestion,
    flowProgress,
    previewItems,
    loading,
    successMessage,
    loadNextQuestion,
    parseAnswer,
    applyUpdates,
    skipQuestion,
    discardPreview,
    pauseFlow,
  };
}
