"use client";

import { useState } from "react";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/input";
import { ReviewDenied, STATE_LABELS, apply, can, createDraft, type Actor, type ReviewAction, type ReviewRequest } from "@/lib/legal-review/workflow";

const USER: Actor = { kind: "user", userId: "synthetischer-nutzer" };
const FIRM: Actor = { kind: "firm", firmId: "sandbox-kanzlei" };
const ACTION_LABELS: Partial<Record<ReviewAction, string>> = {
  submit: "Freigeben und übermitteln",
  withdraw: "Zurückziehen",
  accept: "Annehmen",
  start_review: "Prüfung beginnen",
  ask_question: "Rückfrage stellen",
  answer_question: "Rückfrage beantworten",
  provide_feedback: "Rückmeldung geben",
  close: "Abschließen",
};
const USER_ACTIONS: ReviewAction[] = ["submit", "answer_question", "withdraw"];
const FIRM_ACTIONS: ReviewAction[] = ["accept", "start_review", "ask_question", "provide_feedback", "close"];

export function ReviewSandbox() {
  const [request, setRequest] = useState<ReviewRequest>(() =>
    createDraft("sandbox-1", "synthetischer-nutzer", "sandbox-kanzlei", "Synthetische Gesprächsunterlage (keine echten Daten).")
  );
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const run = (actor: Actor, action: ReviewAction) => {
    setError("");
    try {
      setRequest(apply(request, actor, action as Exclude<ReviewAction, "read">, { text, releaseConfirmed: true }));
      setText("");
    } catch (e) {
      setError(e instanceof ReviewDenied ? e.message : "Fehler");
    }
  };

  const panel = (title: string, actor: Actor, actions: ReviewAction[]) => (
    <Card>
      <CardTitle className="text-base">{title}</CardTitle>
      <p className="text-xs text-muted mb-3">Sieht den Fall: {can(actor, "read", request) ? "ja" : "nein"}</p>
      <div className="flex flex-wrap gap-2">
        {actions.filter((a) => can(actor, a, request)).map((a) => (
          <Button key={a} size="sm" variant="outline" onClick={() => run(actor, a)}>{ACTION_LABELS[a]}</Button>
        ))}
      </div>
    </Card>
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-4">
      <p className="rounded-lg border-2 border-warning bg-warning/10 p-3 text-sm font-semibold">
        SANDBOX – synthetische Daten, keine Kanzlei, kein Mandat, keine Speicherung.
      </p>
      <h1 className="text-2xl font-bold text-primary">Juristischer Prüfworkflow</h1>
      <p className="text-sm">Status: <strong>{STATE_LABELS[request.state]}</strong> · Dokumentversionen: {request.documents.length}</p>
      <Textarea aria-label="Text für Rückfrage, Antwort oder Rückmeldung" value={text} onChange={(e) => setText(e.target.value)} />
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <div className="grid gap-4 md:grid-cols-2">
        {panel("Nutzeransicht", USER, USER_ACTIONS)}
        {panel("Kanzleiansicht (Sandbox)", FIRM, FIRM_ACTIONS)}
      </div>
      <Card>
        <CardTitle className="text-base">Nachrichten</CardTitle>
        <ul className="text-sm space-y-1">
          {request.messages.map((m) => <li key={m.at + m.author}>{m.author === "firm" ? "Kanzlei" : "Nutzer"}: {m.text}</li>)}
        </ul>
      </Card>
      <Card>
        <CardTitle className="text-base">Audit-Protokoll</CardTitle>
        <ol className="text-xs text-muted space-y-1">
          {request.audit.map((a, i) => <li key={i}>{new Date(a.at).toLocaleString("de-DE")} · {a.actor} · {a.action}{a.detail ? ` · ${a.detail}` : ""}</li>)}
        </ol>
      </Card>
    </div>
  );
}
