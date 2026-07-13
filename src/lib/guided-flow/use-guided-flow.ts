"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getStorageMode } from "@/lib/auth/config";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { parseGuidedAnswer } from "@/lib/guided-flow/answer-parser";
import { applyConfirmedUpdates } from "@/lib/guided-flow/apply-confirmed-updates";
import { GUIDED_FLOW_STORAGE_KEY } from "@/lib/guided-flow/config";
import { getNextGuidedQuestion, resolveQuestion, unskipQuestion } from "@/lib/guided-flow/flow-engine";
import type {
  FlowMode,
  FlowProgress,
  GuidedFlowState,
  GuidedQuestion,
  NextQuestionResponse,
  PatchPreviewItem,
  SuggestedUpdate,
} from "@/lib/guided-flow/types";
import { buildPatchPreview } from "@/lib/guided-flow/patch-preview";

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

function useLocalFlowEngine() {
  return getStorageMode() === "local";
}

export function useGuidedFlow() {
  const store = useAmanahStore();
  const localEngine = useLocalFlowEngine();
  const initialized = useRef(false);
  const [state, setState] = useState<GuidedFlowState>({ ...DEFAULT_STATE, ...loadPersistedState() });
  const [currentQuestion, setCurrentQuestion] = useState<GuidedQuestion | null>(null);
  const [flowProgress, setFlowProgress] = useState<FlowProgress | null>(null);
  const [previewItems, setPreviewItems] = useState<PatchPreviewItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [questionHistory, setQuestionHistory] = useState<string[]>([]);

  const fetchNextQuestion = useCallback(
    async (
      skipped: string[],
      completed: string[],
      dataOverride?: ReturnType<typeof pickDataFields>
    ): Promise<NextQuestionResponse> => {
      const data = dataOverride ?? pickDataFields(store);
      if (localEngine) {
        return getNextGuidedQuestion(data, skipped, completed);
      }
      const res = await fetch("/api/guided-flow/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data, skippedQuestions: skipped, completedQuestions: completed }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Frage konnte nicht geladen werden.");
      return json;
    },
    [store, localEngine]
  );

  const applyNextResult = useCallback((r: NextQuestionResponse, pushHistory?: string) => {
    setCurrentQuestion(r.question);
    setFlowProgress(r.flowProgress);
    if (pushHistory) {
      setQuestionHistory((h) => [...h, pushHistory]);
    }
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
          currentQuestionId: r.question!.id,
          answerDraft: "",
          suggestedUpdates: [],
          clarificationNeeded: [],
          error: null,
        };
        persistState(next);
        return next;
      });
    }
  }, []);

  const loadNextQuestion = useCallback(async () => {
    setLoading(true);
    setSuccessMessage(null);
    setState((s) => ({ ...s, error: null }));
    try {
      const r = await fetchNextQuestion(state.skippedQuestions, state.completedQuestions);
      applyNextResult(r, currentQuestion?.id);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Frage konnte nicht geladen werden.";
      try {
        const fallback = getNextGuidedQuestion(
          pickDataFields(store),
          state.skippedQuestions,
          state.completedQuestions
        );
        if (fallback.question || fallback.done) {
          applyNextResult(fallback, currentQuestion?.id);
        } else {
          setState((s) => ({ ...s, error: msg, flowMode: "idle" }));
        }
      } catch {
        setState((s) => ({ ...s, error: msg, flowMode: "idle" }));
      }
    }
    setLoading(false);
  }, [fetchNextQuestion, state.skippedQuestions, state.completedQuestions, applyNextResult, currentQuestion?.id, store]);

  const parseAnswer = useCallback(async () => {
    if (!currentQuestion || !state.answerDraft.trim()) return;
    setLoading(true);
    setSuccessMessage(null);
    try {
      const data = pickDataFields(store);
      let r;
      if (localEngine) {
        r = await parseGuidedAnswer(data, currentQuestion.id, state.answerDraft, { useAiExtract: false });
      } else {
        const res = await fetch("/api/guided-flow/parse-answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data,
            questionId: currentQuestion.id,
            answer: state.answerDraft,
            skippedQuestions: state.skippedQuestions,
            completedQuestions: state.completedQuestions,
          }),
        });
        r = await res.json();
        if (!res.ok) throw new Error(r.error || "Antwort konnte nicht verarbeitet werden.");
      }
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
        setPreviewItems(r.previewItems ?? buildPatchPreview(data, r.suggestedUpdates ?? []));
      }
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler" }));
    }
    setLoading(false);
  }, [currentQuestion, state.answerDraft, state.skippedQuestions, state.completedQuestions, store, localEngine]);

  const applyUpdates = useCallback(
    async (updates: SuggestedUpdate[], overwrite = false) => {
      if (!currentQuestion) return;
      setLoading(true);
      const newCompleted = [...new Set([...state.completedQuestions, currentQuestion.id])];
      try {
        const data = pickDataFields(store);
        let updatedData = data;
        if (localEngine) {
          updatedData = applyConfirmedUpdates(data, updates, { overwrite }).data;
        } else {
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
          if (!res.ok) throw new Error(r.error || "Speichern fehlgeschlagen.");
          updatedData = r.data;
        }
        store.importData(updatedData);
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
        setSuccessMessage("Angabe gespeichert.");

        const next = await fetchNextQuestion(state.skippedQuestions, newCompleted, updatedData);
        applyNextResult(next, currentQuestion.id);
      } catch (e) {
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Speichern fehlgeschlagen." }));
      }
      setLoading(false);
    },
    [store, currentQuestion, state.skippedQuestions, state.completedQuestions, localEngine, fetchNextQuestion, applyNextResult]
  );

  const saveAndContinue = useCallback(async () => {
    if (!currentQuestion || !state.answerDraft.trim()) return;
    setLoading(true);
    setSuccessMessage(null);
    try {
      const data = pickDataFields(store);
      const r = localEngine
        ? await parseGuidedAnswer(data, currentQuestion.id, state.answerDraft, { useAiExtract: false })
        : await (async () => {
            const res = await fetch("/api/guided-flow/parse-answer", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                data,
                questionId: currentQuestion.id,
                answer: state.answerDraft,
                skippedQuestions: state.skippedQuestions,
                completedQuestions: state.completedQuestions,
              }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error || "Antwort konnte nicht verarbeitet werden.");
            return json;
          })();

      if (r.blocked) {
        setState((s) => ({ ...s, error: r.message, flowMode: "asking" }));
        setLoading(false);
        return;
      }
      if ((r.clarificationNeeded?.length ?? 0) > 0 && (r.suggestedUpdates?.length ?? 0) === 0) {
        setState((s) => ({
          ...s,
          clarificationNeeded: r.clarificationNeeded ?? [],
          error: r.clarificationNeeded?.[0] ?? "Bitte präzisiere deine Antwort.",
          flowMode: "asking",
        }));
        setLoading(false);
        return;
      }
      if ((r.suggestedUpdates?.length ?? 0) > 0) {
        await applyUpdates(r.suggestedUpdates, false);
        return;
      }
      setState((s) => ({ ...s, error: "Antwort konnte nicht zugeordnet werden. Bitte präzisieren oder überspringen." }));
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler beim Speichern." }));
    }
    setLoading(false);
  }, [currentQuestion, state.answerDraft, state.skippedQuestions, state.completedQuestions, store, localEngine, applyUpdates]);

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
      const r = await fetchNextQuestion(newSkipped, state.completedQuestions);
      applyNextResult(r, currentQuestion.id);
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Fehler" }));
    }
    setLoading(false);
  }, [currentQuestion, state.skippedQuestions, state.completedQuestions, fetchNextQuestion, applyNextResult]);

  const goBack = useCallback(() => {
    if (questionHistory.length === 0) return;
    const prevId = questionHistory[questionHistory.length - 1];
    const q = resolveQuestion(prevId);
    if (!q) return;
    setQuestionHistory((h) => h.slice(0, -1));
    setCurrentQuestion(q);
    setState((s) => {
      const next = { ...s, flowMode: "asking" as FlowMode, currentQuestionId: q.id, error: null, answerDraft: "" };
      persistState(next);
      return next;
    });
    setPreviewItems([]);
    setSuccessMessage(null);
  }, [questionHistory]);

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
      const next = { ...s, flowMode: "paused" as FlowMode };
      persistState(next);
      return next;
    });
    setCurrentQuestion(null);
  }, []);

  const resumeFlow = useCallback(async () => {
    setState((s) => ({ ...s, flowMode: "asking" as FlowMode, error: null }));
    const resumed = resolveQuestion(state.currentQuestionId);
    if (resumed) {
      setCurrentQuestion(resumed);
      const data = pickDataFields(store);
      setFlowProgress(getNextGuidedQuestion(data, state.skippedQuestions, state.completedQuestions).flowProgress);
      return;
    }
    await loadNextQuestion();
  }, [state.currentQuestionId, state.skippedQuestions, state.completedQuestions, store, loadNextQuestion]);

  const retrySkippedQuestion = useCallback(
    async (questionId: string) => {
      const newSkipped = unskipQuestion(questionId, state.skippedQuestions);
      setState((s) => {
        const next = {
          ...s,
          skippedQuestions: newSkipped,
          flowMode: "asking" as FlowMode,
          currentQuestionId: questionId,
          answerDraft: "",
          error: null,
        };
        persistState(next);
        return next;
      });
      const q = resolveQuestion(questionId);
      setCurrentQuestion(q);
      setSuccessMessage(null);
      setPreviewItems([]);
    },
    [state.skippedQuestions]
  );

  const resetFlow = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(GUIDED_FLOW_STORAGE_KEY);
    }
    setState(DEFAULT_STATE);
    setCurrentQuestion(null);
    setFlowProgress(null);
    setPreviewItems([]);
    setQuestionHistory([]);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const r = await fetchNextQuestion([], []);
      applyNextResult(r);
    } catch (e) {
      const fallback = getNextGuidedQuestion(pickDataFields(store), [], []);
      applyNextResult(fallback);
      if (!fallback.question && !fallback.done) {
        setState((s) => ({ ...s, error: e instanceof Error ? e.message : "Zurücksetzen fehlgeschlagen." }));
      }
    }
    setLoading(false);
  }, [fetchNextQuestion, applyNextResult, store]);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const persisted = loadPersistedState();
    if (persisted.flowMode === "paused") return;
    if (persisted.flowMode === "done") {
      const data = pickDataFields(store);
      setFlowProgress(getNextGuidedQuestion(data, persisted.skippedQuestions ?? [], persisted.completedQuestions ?? []).flowProgress);
      return;
    }

    if (persisted.currentQuestionId) {
      const q = resolveQuestion(persisted.currentQuestionId);
      if (q) {
        setCurrentQuestion(q);
        setState((s) => ({ ...s, flowMode: "asking" as FlowMode, currentQuestionId: q.id }));
        const data = pickDataFields(store);
        setFlowProgress(
          getNextGuidedQuestion(data, persisted.skippedQuestions ?? [], persisted.completedQuestions ?? []).flowProgress
        );
        return;
      }
    }

    void loadNextQuestion();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount once

  return {
    state,
    setState,
    currentQuestion,
    flowProgress,
    previewItems,
    loading,
    successMessage,
    questionHistory,
    loadNextQuestion,
    parseAnswer,
    saveAndContinue,
    applyUpdates,
    skipQuestion,
    goBack,
    discardPreview,
    pauseFlow,
    resumeFlow,
    retrySkippedQuestion,
    resetFlow,
  };
}
