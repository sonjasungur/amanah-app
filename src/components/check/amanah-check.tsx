"use client";

import { useReducer, useCallback, useEffect, useLayoutEffect, useRef } from "react";
import Link from "next/link";
import { CHECK_QUESTIONS, CHECK_TOTAL } from "@/lib/check/questions";
import { computeCheckResult, getRuleBasedNextSteps } from "@/lib/check/results";
import {
  checkReducer,
  createInitialCheckState,
  loadCheckState,
  persistCheckState,
  clearCheckState,
  CHECK_HYDRATE_TIMEOUT_MS,
  type CheckState,
} from "@/lib/check/state-machine";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { checkStateToProgress, defaultCheckProgress } from "@/lib/check/progress";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronDown, Loader2, RotateCcw } from "lucide-react";

export function AmanahCheck() {
  const [state, dispatch] = useReducer(checkReducer, undefined, createInitialCheckState);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydrateTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useLayoutEffect(() => {
    const loaded = loadCheckState();
    if (loaded.ok) {
      dispatch({
        type: "HYDRATE_DONE",
        state: {
          index: loaded.data.index,
          answers: loaded.data.answers,
          phase: loaded.data.phase,
        },
      });
    } else {
      dispatch({ type: "HYDRATE_FAIL", error: loaded.error });
    }
  }, []);

  useEffect(() => {
    if (state.hydrated) return;
    hydrateTimer.current = setTimeout(() => {
      dispatch({ type: "HYDRATE_TIMEOUT" });
    }, CHECK_HYDRATE_TIMEOUT_MS);
    return () => {
      if (hydrateTimer.current) clearTimeout(hydrateTimer.current);
    };
  }, [state.hydrated]);

  useEffect(() => {
    if (!state.hydrated || state.phase === "loading") return;
    persistCheckState(state);
    // An untouched check must not overwrite progress from the folder, e.g. from another device.
    if (state.phase === "intro" && state.index === 0 && Object.keys(state.answers).length === 0) return;
    const writeToFolder = () => {
      useAmanahStore.getState().updateField("checkProgress", checkStateToProgress(state));
    };
    if (useAmanahStore.persist.hasHydrated()) {
      writeToFolder();
      return;
    }
    return useAmanahStore.persist.onFinishHydration(writeToFolder);
  }, [state]);

  useEffect(() => {
    if (state.phase !== "saving") return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      dispatch({ type: "SAVE_DONE", nextIndex: state.index + 1 });
    }, 120);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [state.phase, state.index]);

  const start = useCallback(() => dispatch({ type: "START" }), []);
  const answer = useCallback((value: boolean) => dispatch({ type: "ANSWER", value }), []);
  const back = useCallback(() => dispatch({ type: "BACK" }), []);
  const reset = useCallback(() => {
    clearCheckState();
    useAmanahStore.getState().updateField("checkProgress", defaultCheckProgress);
    dispatch({ type: "RESET" });
  }, []);
  const retry = useCallback(() => dispatch({ type: "RETRY" }), []);

  if (state.phase === "loading") {
    return (
      <div className="max-w-lg mx-auto p-8 text-center" data-testid="check-loading" role="status" aria-live="polite">
        <Loader2 className="mx-auto mb-3 animate-spin text-accent" size={32} aria-hidden />
        <p className="text-muted">Check wird geladen…</p>
      </div>
    );
  }

  if (state.phase === "error") {
    return (
      <Card className="max-w-lg mx-auto p-8 text-center space-y-4 relative z-20" data-testid="check-error" role="alert">
        <AlertTriangle className="mx-auto text-danger" size={36} aria-hidden />
        <h2 className="text-xl font-bold text-primary">Etwas ist schiefgelaufen</h2>
        <p className="text-muted text-sm">{state.error ?? "Unbekannter Fehler."}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
          <Button type="button" onClick={retry} data-testid="check-retry">
            Erneut versuchen
          </Button>
          <Button type="button" variant="outline" onClick={reset} data-testid="check-back-to-start">
            Zum Start
          </Button>
        </div>
      </Card>
    );
  }

  if (state.phase === "intro") {
    const hasProgress = Object.keys(state.answers).length > 0 || state.index > 0;
    return (
      <Card className="max-w-lg mx-auto overflow-hidden shadow-lg border-border relative z-20" data-testid="check-intro">
        <div className="bg-primary-dark px-6 py-8 text-center text-white">
          <div className="w-14 h-14 rounded-2xl bg-emerald/20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={28} className="text-emerald" aria-hidden />
          </div>
          <h2 className="text-xl font-bold">Bereit für deinen Vorsorge-Check?</h2>
        </div>
        <div className="p-8 space-y-6">
          <p className="text-muted text-body leading-relaxed">
            {CHECK_TOTAL} kurze Ja/Nein-Fragen zu deiner Situation und Vorbereitung. Du kannst jederzeit zurückgehen — Antworten bleiben erhalten.
          </p>
          <div className="flex flex-col gap-3">
            <Button type="button" size="lg" onClick={start} data-testid="check-start" className="w-full">
              {hasProgress ? CHECK_LABELS.continueButton : CHECK_LABELS.startButton}
            </Button>
            {hasProgress && (
              <Button type="button" variant="ghost" size="sm" onClick={reset}>
                <RotateCcw size={14} className="mr-1" /> Neu beginnen
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  if (state.phase === "result") {
    return <CheckResults state={state} onReset={reset} />;
  }

  const q = CHECK_QUESTIONS[state.index];
  if (!q) {
    return (
      <Card className="max-w-lg mx-auto p-8 text-center space-y-4 relative z-20" data-testid="check-error">
        <p className="text-muted">Frage konnte nicht geladen werden.</p>
        <Button type="button" onClick={reset}>Neu starten</Button>
      </Card>
    );
  }

  return <CheckQuestion state={state} onAnswer={answer} onBack={back} />;
}

/**
 * The question card (owner order 25.11.2026: absolutely calm). Saving an answer keeps this card in place:
 * no spinner card, no remount, no scale or ring effects. Every row has a fixed height, so the question,
 * the answer buttons and the progress bar never move when Ja or Nein is clicked; only colours and text change.
 */
function CheckQuestion({
  state,
  onAnswer,
  onBack,
}: {
  state: CheckState;
  onAnswer: (value: boolean) => void;
  onBack: () => void;
}) {
  const q = CHECK_QUESTIONS[state.index]!;
  const saving = state.phase === "saving";
  const progressPercent = Math.round(((state.index + 1) / CHECK_TOTAL) * 100);
  const currentAnswer = state.answers[q.id];
  const answerClass = (selected: boolean) =>
    `check-answer flex-1 h-16 sm:h-[72px] rounded-2xl font-semibold text-lg cursor-pointer touch-manipulation inline-flex items-center justify-center gap-3 ${
      selected ? "is-selected" : ""
    }`;

  return (
    <div className="relative z-20" data-testid="check-question">
      <Card className="check-card max-w-2xl mx-auto px-5 py-6 sm:px-10 sm:py-9">
        <div className="flex justify-between items-center h-6 text-sm text-muted mb-2.5">
          <span data-testid="check-progress-label" className="tabular-nums">Frage {state.index + 1} von {CHECK_TOTAL}</span>
          <span className="font-semibold text-accent tabular-nums w-12 text-right">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="mb-7" />
        <p className="h-5 text-xs uppercase tracking-[0.16em] text-accent font-semibold mb-3">
          {q.category === "profil" ? "Deine Situation" : "Vorbereitung"}
        </p>
        <div className="h-[7.5rem] sm:h-[8.5rem] overflow-hidden">
          <h2 className="check-question-text text-primary-dark" data-testid="check-question-text">{q.text}</h2>
        </div>
        <p className="h-6 text-sm text-muted mb-6 truncate">Thema: {q.label}</p>
        <div className="flex gap-3 sm:gap-4 mb-5" role="group" aria-label="Antwort">
          <button
            type="button"
            data-testid="check-answer-yes"
            onClick={() => !saving && onAnswer(true)}
            aria-pressed={currentAnswer === true}
            aria-disabled={saving || undefined}
            className={answerClass(currentAnswer === true)}
          >
            <span className="check-answer-dot" aria-hidden /> Ja
          </button>
          <button
            type="button"
            data-testid="check-answer-no"
            onClick={() => !saving && onAnswer(false)}
            aria-pressed={currentAnswer === false}
            aria-disabled={saving || undefined}
            className={answerClass(currentAnswer === false)}
          >
            <span className="check-answer-dot" aria-hidden /> Nein
          </button>
        </div>
        <div className="flex justify-between items-center h-11 pt-2 border-t border-border">
          <Button type="button" variant="ghost" size="sm" onClick={() => !saving && onBack()} data-testid="check-back">
            <ArrowLeft size={14} className="mr-1" /> Zurück
          </Button>
          <p className="text-xs text-muted">Du kannst jederzeit zurück.</p>
        </div>
      </Card>
      {saving && (
        <p className="sr-only" role="status" aria-live="polite" data-testid="check-saving">
          Antwort wird gespeichert
        </p>
      )}
    </div>
  );
}

/** Encouraging headline per status; the status itself still comes unchanged from computeCheckResult. */
const RESULT_TITLES: Record<"green" | "yellow" | "red", { title: string; text: string }> = {
  green: { title: "Eine solide Grundlage", text: "Vieles ist schon geregelt. Halte deine Angaben aktuell und teile sie mit deinen Vertrauenspersonen." },
  yellow: { title: "Du hast schon begonnen", text: "Ein guter Teil ist geschafft. Mit den nächsten Schritten unten schließt du die wichtigsten Lücken." },
  red: { title: "Ein guter Zeitpunkt, um anzufangen", text: "Du musst nicht alles auf einmal erledigen. Ein Schritt nach dem anderen reicht – wir zeigen dir, womit du beginnst." },
};

function ResultRing({ percent }: { percent: number }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 120 120" className="w-32 h-32 md:w-40 md:h-40 shrink-0" aria-hidden>
      <defs>
        <linearGradient id="result-ring" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#FFF0B8" />
          <stop offset=".5" stopColor="#E2B54C" />
          <stop offset="1" stopColor="#A97A18" />
        </linearGradient>
      </defs>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(226,181,76,0.22)" strokeWidth="10" />
      <circle cx="60" cy="60" r={r} fill="none" stroke="url(#result-ring)" strokeWidth="10" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - percent / 100)} transform="rotate(-90 60 60)" />
      <text x="60" y="66" textAnchor="middle" fontSize="26" fill="#FFFFFF" fontFamily="Georgia, serif">{percent}%</text>
    </svg>
  );
}

function CheckResults({ state, onReset }: { state: CheckState; onReset: () => void }) {
  const result = computeCheckResult(state.answers);
  const ruleSteps = getRuleBasedNextSteps(result);
  const head = RESULT_TITLES[result.status];
  const percent = result.prepTotal > 0 ? Math.round((result.prepYesCount / result.prepTotal) * 100) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6 relative z-20" data-testid="check-results">
      <section className="on-dark wasiyya-hero rounded-3xl text-white p-7 md:p-10 ring-1 ring-[#D4A537]/45 shadow-[0_30px_70px_-24px_rgba(11,18,38,0.6)] flex flex-col sm:flex-row items-center gap-6 md:gap-10">
        <ResultRing percent={percent} />
        <div className="text-center sm:text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F2CF6C]">Dein Ergebnis</p>
          <h2 className="text-page-title mt-2" data-testid="check-status-title">{head.title}</h2>
          <p className="text-lg text-white/90 mt-3">
            {result.prepYesCount} von {result.prepTotal} Vorbereitungsbereichen sind schon geklärt.
          </p>
          <p className="text-base text-white/75 mt-2">{head.text}</p>
          <p className="sr-only">Einstufung: {result.statusLabel}</p>
        </div>
      </section>

      <section className="gold-frame-strong rounded-3xl p-7 md:p-9 shadow-[0_24px_60px_-28px_rgba(11,18,38,0.45)]" data-testid="check-primary-recommendation">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-accent">Dein nächster Schritt</p>
        <p className="text-section-title text-primary-dark mt-2">{result.primaryRecommendation.label}</p>
        <p className="text-lg text-muted mt-2">{result.primaryRecommendation.reason}</p>
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link
            href={result.primaryRecommendation.href}
            className="wasiyya-cta inline-flex items-center justify-center rounded-xl font-bold min-h-[54px] px-7 text-lg"
            data-testid="check-primary-cta"
          >
            {result.nextSteps[0]?.label ?? "Diesen Schritt jetzt erledigen"}
          </Link>
          <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl font-semibold min-h-[54px] px-6 text-lg text-primary-dark border-2 border-[#D4A537]/70 hover:bg-accent-soft">
            Zu meinem Vorsorgeplan
          </Link>
        </div>
      </section>

      {result.visibleTasks.length > 0 && (
        <section className="rounded-3xl bg-card border border-border p-7 md:p-9">
          <h3 className="text-section-title text-primary-dark">Deine Prioritäten</h3>
          <ol className="mt-5 space-y-3" data-testid="check-visible-tasks">
            {result.visibleTasks.map((g, idx) => (
              <li key={g.id} className="flex items-center gap-4 rounded-2xl bg-accent-soft px-4 py-3.5">
                <span className="w-9 h-9 rounded-full wasiyya-cta flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
                <span className="flex-1 text-lg text-foreground">
                  {g.modulePath ? (
                    <Link href={g.modulePath} className="font-semibold hover:underline">{g.label}</Link>
                  ) : (
                    <span className="font-semibold">{g.label}</span>
                  )}
                </span>
                {g.urgent && (
                  <span className="text-xs font-bold uppercase tracking-wider text-primary-dark bg-[#F2CF6C]/50 rounded-full px-3 py-1">Zuerst</span>
                )}
              </li>
            ))}
          </ol>
          <p className="text-base text-muted mt-4">{ruleSteps.join(" ")}</p>
        </section>
      )}

      {result.personalizedHints.length > 0 && (
        <section className="rounded-3xl bg-card border border-border p-7 md:p-9" data-testid="check-personalized-hints">
          <h3 className="text-section-title text-primary-dark">Für deine Situation</h3>
          <ul className="mt-4 space-y-3">
            {result.personalizedHints.map((h) => (
              <li key={h} className="flex gap-3 text-lg text-foreground">
                <span className="w-2 h-2 rounded-full bg-[#D4A537] shrink-0 mt-3" aria-hidden />
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

      {result.prepared.length > 0 && (
        <section className="rounded-3xl bg-card border border-border p-7 md:p-9">
          <h3 className="text-section-title text-primary-dark flex items-center gap-3">
            <CheckCircle2 size={26} className="text-accent" aria-hidden /> Das hast du schon geregelt
          </h3>
          <ul className="mt-4 grid gap-2 sm:grid-cols-2">
            {result.prepared.map((p) => (
              <li key={p} className="flex gap-2 text-lg text-foreground"><span className="text-accent font-bold" aria-hidden>✓</span>{p}</li>
            ))}
          </ul>
        </section>
      )}

      {result.furtherTasks.length > 0 && (
        <details className="rounded-3xl border border-border bg-card p-7" data-testid="check-further-tasks">
          <summary className="text-lg font-semibold text-primary-dark cursor-pointer min-h-[44px] flex items-center justify-between">
            Weitere Schritte für später
            <ChevronDown size={20} className="text-muted" />
          </summary>
          <ul className="space-y-2 mt-4">
            {result.furtherTasks.map((g) => (
              <li key={g.id} className="text-base text-muted border-b border-border pb-2 last:border-0">{g.label}</li>
            ))}
          </ul>
        </details>
      )}

      <section className="on-dark rounded-3xl bg-navy text-white p-7 md:p-9 ring-1 ring-[#D4A537]/40">
        <h3 className="text-section-title">So geht es weiter</h3>
        <ol className="mt-5 grid gap-4 md:grid-cols-3">
          {[
            ["Konto anlegen", "Dein Ergebnis wird gespeichert, verschlüsselt und nur für dich."],
            ["Schritt für Schritt festhalten", "Im Vorsorgeplan ergänzt du, was noch fehlt – in deinem Tempo."],
            ["Für die Familie bereitlegen", "Notfallkarte und Unterlagen drucken und an einem sicheren Ort aufbewahren."],
          ].map(([t, d], idx) => (
            <li key={t} className="flex gap-3">
              <span className="w-8 h-8 rounded-full ring-1 ring-[#F2CF6C] text-[#F2CF6C] flex items-center justify-center font-bold shrink-0">{idx + 1}</span>
              <span><span className="block font-semibold text-lg">{t}</span><span className="text-white/80">{d}</span></span>
            </li>
          ))}
        </ol>
        <Link href="/dashboard" className="wasiyya-cta mt-7 inline-flex items-center justify-center rounded-xl font-bold min-h-[52px] px-7">
          Zu meinem Vorsorgeplan
        </Link>
      </section>

      <Button variant="ghost" size="sm" type="button" onClick={onReset} data-testid="check-reset">
        <RotateCcw size={14} className="mr-1" /> Check wiederholen
      </Button>
    </div>
  );
}
