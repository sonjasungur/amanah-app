"use client";

import { useReducer, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { CHECK_QUESTIONS, CHECK_TOTAL } from "@/lib/check/questions";
import { computeCheckResult, getRuleBasedNextSteps } from "@/lib/check/results";
import {
  checkReducer,
  INITIAL_CHECK_STATE,
  loadCheckState,
  persistCheckState,
  clearCheckState,
  type CheckState,
} from "@/lib/check/state-machine";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Loader2, RotateCcw } from "lucide-react";

export function AmanahCheck() {
  const [state, dispatch] = useReducer(checkReducer, INITIAL_CHECK_STATE);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    dispatch({ type: "HYDRATE_START" });
    const loaded = loadCheckState();
    if (loaded.ok) {
      dispatch({
        type: "HYDRATE_DONE",
        state: {
          index: loaded.data.index,
          answers: loaded.data.answers,
          phase: loaded.data.phase === "result" ? "result" : loaded.data.index > 0 ? "question" : "intro",
        },
      });
    } else {
      dispatch({ type: "HYDRATE_FAIL", error: loaded.error });
    }
  }, []);

  useEffect(() => {
    if (!state.hydrated || state.phase === "loading") return;
    persistCheckState(state);
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

  if (state.phase === "saving") {
    const q = CHECK_QUESTIONS[state.index];
    return (
      <Card className="max-w-lg mx-auto p-8 text-center relative z-20" data-testid="check-saving" role="status" aria-live="polite">
        <Loader2 className="mx-auto mb-3 animate-spin text-accent" size={28} aria-hidden />
        <p className="text-muted text-sm">Antwort wird gespeichert…</p>
        {q && <p className="sr-only">Frage: {q.text}</p>}
      </Card>
    );
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

  const progressPercent = Math.round(((state.index + 1) / CHECK_TOTAL) * 100);
  const currentAnswer = state.answers[q.id];

  return (
    <div className="relative z-20" key={`check-q-${state.index}`}>
      <Card className="max-w-lg mx-auto p-6 shadow-lg border-primary/15">
        <div className="flex justify-between text-sm text-muted mb-2">
          <span data-testid="check-progress-label">Frage {state.index + 1} von {CHECK_TOTAL}</span>
          <span className="font-semibold text-accent">{progressPercent}%</span>
        </div>
        <div
          className="h-3 bg-sand rounded-full mb-6 overflow-hidden"
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Fortschritt: ${progressPercent} Prozent`}
        >
          <div className="h-full bg-emerald transition-all duration-300 rounded-full" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-xs uppercase tracking-wide text-accent font-semibold mb-2">
          {q.category === "profil" ? "Deine Situation" : "Vorbereitung"}
        </p>
        <h2 className="text-xl font-bold text-primary mb-2" data-testid="check-question-text">{q.text}</h2>
        <p className="text-sm text-muted mb-6">Thema: {q.label}</p>
        <div className="flex gap-3 sm:gap-4 mb-4">
          <button
            type="button"
            data-testid="check-answer-yes"
            onClick={() => answer(true)}
            aria-pressed={currentAnswer === true}
            className={`flex-1 min-h-[52px] rounded-xl font-bold text-lg shadow-md active:scale-[0.98] transition-all cursor-pointer touch-manipulation ${
              currentAnswer === true
                ? "bg-emerald text-white ring-2 ring-emerald ring-offset-2"
                : "bg-emerald text-white hover:bg-primary-hover"
            }`}
          >
            Ja
          </button>
          <button
            type="button"
            data-testid="check-answer-no"
            onClick={() => answer(false)}
            aria-pressed={currentAnswer === false}
            className={`flex-1 min-h-[52px] rounded-xl border-2 font-bold text-lg active:scale-[0.98] transition-all cursor-pointer touch-manipulation ${
              currentAnswer === false
                ? "border-foreground/30 bg-foreground/5 text-foreground ring-2 ring-border ring-offset-2"
                : "border-border bg-card text-muted hover:border-foreground/20 hover:bg-background"
            }`}
          >
            Nein
          </button>
        </div>
        <div className="flex justify-between items-center pt-2 border-t border-primary/5">
          <Button type="button" variant="ghost" size="sm" onClick={back} data-testid="check-back">
            <ArrowLeft size={14} className="mr-1" /> Zurück
          </Button>
          {state.index > 0 && currentAnswer !== undefined && (
            <p className="text-xs text-muted">Vorherige Antwort gespeichert</p>
          )}
        </div>
      </Card>
    </div>
  );
}

function CheckResults({ state, onReset }: { state: CheckState; onReset: () => void }) {
  const result = computeCheckResult(state.answers);
  const ruleSteps = getRuleBasedNextSteps(result);
  const colors = {
    green: "text-success bg-success/10 border-success/30",
    yellow: "text-warning bg-warning/10 border-warning/30",
    red: "text-danger bg-danger/10 border-danger/30",
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 relative z-20" data-testid="check-results">
      <Card className="text-center p-8">
        <div className={`inline-block rounded-full px-6 py-2 text-lg font-bold mb-4 border ${colors[result.status]}`}>
          {result.statusLabel}
        </div>
        <p className="text-muted mb-1">
          {result.prepYesCount} von {result.prepTotal} Vorbereitungsbereichen mit Ja beantwortet
        </p>
        <p className="text-sm text-muted">
          {result.status === "red" && "Deine Amanah ist noch nicht geordnet. Jetzt handeln — Schritt für Schritt."}
          {result.status === "yellow" && "Du hast begonnen. Die Lücken unten solltest du als Nächstes schließen."}
          {result.status === "green" && "Gute Basis. Halte den Ordner aktuell und teile ihn mit Vertrauenspersonen."}
        </p>
      </Card>

      {result.personalizedHints.length > 0 && (
        <Card className="p-6 space-y-3 border-accent/30 bg-accent/5" data-testid="check-personalized-hints">
          <h3 className="font-semibold text-primary">Persönliche Hinweise für deine Situation</h3>
          <ul className="text-sm text-muted space-y-2 list-disc pl-4">
            {result.personalizedHints.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        </Card>
      )}

      {result.missing.length > 0 && (
        <Card className="p-6 space-y-4">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <AlertTriangle size={18} className="text-accent" />
            Dir fehlen wahrscheinlich noch:
          </h3>
          <ul className="space-y-2">
            {result.missing.map((g) => (
              <li key={g.label} className="flex items-center justify-between gap-3 text-sm border-b border-primary/5 pb-2 last:border-0">
                <span>
                  {g.label}
                  {g.urgent && <span className="ml-2 text-xs text-accent font-semibold uppercase">dringend</span>}
                </span>
                {g.modulePath && (
                  <Link href={g.modulePath} className="text-accent hover:underline shrink-0 flex items-center gap-1 font-medium">
                    Ergänzen <ChevronRight size={14} />
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6 space-y-3 bg-primary/5">
        <h3 className="font-semibold text-primary">Deine nächsten 3 Schritte</h3>
        <ol className="text-sm text-muted space-y-2 list-decimal pl-4">
          {ruleSteps.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
        <p className="text-xs text-muted pt-2">Regelbasierte Empfehlung — keine Rechtsberatung, keine Fatwa. Mit Imam/Anwalt/Arzt fachlich prüfen.</p>
      </Card>

      {result.prepared.length > 0 && (
        <Card className="p-6 space-y-3 bg-success/5 border-success/20">
          <h3 className="font-semibold text-primary flex items-center gap-2">
            <CheckCircle2 size={18} className="text-success" />
            Bereits vorbereitet:
          </h3>
          <ul className="text-sm text-muted space-y-1">
            {result.prepared.map((p) => (
              <li key={p}>✓ {p}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-6 space-y-4">
        <h3 className="font-semibold text-primary">Jetzt handeln</h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {result.nextSteps.map((s) => (
            <Link key={s.href} href={s.href}>
              <Button size="lg" variant={s.priority === 1 ? "primary" : s.priority === 2 ? "secondary" : "outline"} className="w-full sm:w-auto">
                {s.label}
              </Button>
            </Link>
          ))}
        </div>
        <Button variant="ghost" size="sm" type="button" onClick={onReset} data-testid="check-reset">
          <RotateCcw size={14} className="mr-1" /> Check wiederholen
        </Button>
      </Card>
    </div>
  );
}
