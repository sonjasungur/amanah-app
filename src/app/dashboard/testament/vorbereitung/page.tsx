"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Lock, Printer } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { isTestamentPreparationEnabled } from "@/lib/flags/testament-preparation";
import { PART_LABELS, PREPARATION_STEPS, isStepRelevant, readStepValue, writeStepValue } from "@/lib/testament/steps";
import { buildLawyerQuestions } from "@/lib/testament/lawyer-questions";
import { toFaraidInput } from "@/lib/testament/faraid-mapping";
import { SUNNI_NUCLEAR_FAMILY_V1, calculateFaraid, isRuleSetDisplayable } from "@/lib/inheritance";
import { FaraidModelResult } from "@/components/testament/faraid-model-result";
import { BequestEditor, BequestSummary } from "@/components/testament/bequest-editor";

function LockedNotice() {
  return (
    <Card className="max-w-2xl" data-testid="testament-preparation-locked">
      <div className="flex items-center gap-2 mb-2">
        <Lock size={18} className="text-primary" aria-hidden />
        <CardTitle>Testament-Vorbereitung – in Vorbereitung</CardTitle>
      </div>
      <p className="text-sm text-muted">
        Dieser Bereich wird erst freigeschaltet, wenn Inhalt und Ablauf rechtlich und fachlich geprüft sind. Bis dahin kannst du dein{" "}
        <Link href="/dashboard/testament" className="text-primary underline">Erbprofil</Link> festhalten.
      </p>
    </Card>
  );
}

export default function TestamentVorbereitungPage() {
  const store = useAmanahStore();
  const prep = store.testamentPreparation;
  const steps = useMemo(() => PREPARATION_STEPS.filter((s) => isStepRelevant(prep, s)), [prep]);

  if (!isTestamentPreparationEnabled()) return <LockedNotice />;

  const index = Math.min(prep.currentStep, steps.length);
  const step = steps[index];
  const save = (next: typeof prep) => store.updateField("testamentPreparation", next);
  const go = (to: number) => save({ ...prep, currentStep: Math.max(0, Math.min(to, steps.length)) });

  return (
    <div className="space-y-6 max-w-2xl">
      <header className="flex flex-wrap items-start justify-between gap-3 no-print">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-1">Testament vorbereiten</h1>
          <p className="text-sm text-muted">Vorbereitung für das Gespräch mit Anwalt oder Notar. Hier entsteht kein Testament.</p>
        </div>
        <SaveStatusIndicator />
      </header>

      <div className="no-print">
        <Progress value={(index / steps.length) * 100} />
        <p className="text-xs text-muted mt-1" data-testid="preparation-progress">
          {index < steps.length ? `Frage ${index + 1} von ${steps.length} · ${PART_LABELS[step.part]}` : "Zusammenfassung"}
        </p>
      </div>

      {step ? (
        <Card data-testid={`preparation-step-${step.id}`}>
          <CardTitle className="text-lg">{step.question}</CardTitle>
          {step.help && <p className="text-sm text-muted mt-1">{step.help}</p>}
          <div className="mt-4 space-y-2">
            {step.type === "choice" &&
              step.options!.map((o) => (
                <Button
                  key={o.value}
                  type="button"
                  variant={readStepValue(prep, step) === o.value ? "primary" : "outline"}
                  className="w-full justify-start"
                  onClick={() => save({ ...writeStepValue(prep, step, o.value), currentStep: index + 1 })}
                >
                  {o.label}
                </Button>
              ))}
            {step.type === "bequests" && (
              <BequestEditor
                bequests={prep.personalWishes.bequests}
                onChange={(bequests) => save({ ...prep, personalWishes: { ...prep.personalWishes, bequests } })}
              />
            )}
            {step.type === "text" && (
              <Input aria-label={step.question} value={readStepValue(prep, step)} onChange={(e) => save(writeStepValue(prep, step, e.target.value))} />
            )}
            {step.type === "textarea" && (
              <Textarea aria-label={step.question} value={readStepValue(prep, step)} onChange={(e) => save(writeStepValue(prep, step, e.target.value))} />
            )}
          </div>
          <div className="mt-6 flex justify-between">
            <Button type="button" variant="outline" size="sm" onClick={() => go(index - 1)} disabled={index === 0}>
              <ArrowLeft size={14} className="mr-1" aria-hidden /> Zurück
            </Button>
            <Button type="button" size="sm" onClick={() => go(index + 1)} data-testid="preparation-next">
              {step.type === "choice" ? "Überspringen" : "Weiter"} <ArrowRight size={14} className="ml-1" aria-hidden />
            </Button>
          </div>
        </Card>
      ) : (
        <PreparationSummary onEdit={() => go(0)} />
      )}
    </div>
  );
}

function PreparationSummary({ onEdit }: { onEdit: () => void }) {
  const data = pickDataFields(useAmanahStore());
  const prep = data.testamentPreparation;
  const questions = buildLawyerQuestions(data);
  const mapping = toFaraidInput(data);
  const model = "input" in mapping ? calculateFaraid(mapping.input) : null;
  const facts = PREPARATION_STEPS.filter((s) => s.part === "legalFacts" && isStepRelevant(prep, s));

  return (
    <div className="space-y-4" data-testid="preparation-summary">
      <p className="rounded-lg border-2 border-warning bg-warning/10 p-3 text-sm font-semibold">
        Gesprächsunterlage – kein Testament. Ein eigenhändiges Testament muss vollständig von Hand geschrieben und unterschrieben sein (§ 2247 BGB).
      </p>

      <Card>
        <CardTitle className="text-base">1. Persönliche Wünsche</CardTitle>
        <p className="text-sm whitespace-pre-wrap">{prep.personalWishes.wishes || "—"}</p>
        <p className="text-sm whitespace-pre-wrap mt-2">Wohltätig: {prep.personalWishes.charitableWishes || "—"}</p>
        <BequestSummary bequests={prep.personalWishes.bequests} ruleSet={SUNNI_NUCLEAR_FAMILY_V1} featureEnabled={isTestamentPreparationEnabled()} />
        {prep.personalWishes.executorPerson && <p className="text-sm mt-2">Wunsch Testamentsvollstreckung: {prep.personalWishes.executorPerson}</p>}
        {prep.personalWishes.guardianPerson && <p className="text-sm mt-2">Wunsch Vormund: {prep.personalWishes.guardianPerson}</p>}
        {prep.personalWishes.guardianExcluded && <p className="text-sm mt-2">Nicht als Vormund: {prep.personalWishes.guardianExcluded}</p>}
      </Card>

      <Card data-testid="preparation-islamic-model">
        <CardTitle className="text-base">2. Islamische Erbwünsche (Modellinformation)</CardTitle>
        <p className="text-sm">Wunsch nach islamischer Verteilung: {prep.islamicModel.wantsIslamicDistribution || "—"} · Rechtsschule: {prep.islamicModel.preferredSchool || "—"}</p>
        {prep.islamicModel.wantsIslamicDistribution === "nein" ? (
          <p className="text-sm text-muted mt-2" data-testid="faraid-not-wanted">Du hast keine islamische Verteilung gewünscht. Deshalb wird hier keine Modellrechnung gezeigt.</p>
        ) : (
          <>
        {"missing" in mapping && <p className="text-sm text-muted mt-2">Für eine Modellrechnung fehlen: {mapping.missing.join(", ")}.</p>}
        {model?.status === "blocked" && <p className="text-sm text-muted mt-2">Sonderfall – keine Modellrechnung: {model.reasons.join(" ")}</p>}
        {model?.status === "calculated" && !isRuleSetDisplayable(model.ruleSet, isTestamentPreparationEnabled()) && (
          <p className="text-sm text-muted mt-2" data-testid="faraid-locked">
            Die Modellrechnung ist gesperrt, bis das Regelwerk von qualifizierten Gelehrten geprüft ist (Regelwerk {model.ruleSet.id} {model.ruleSet.version}, Status: ungeprüft).
          </p>
        )}
        {model?.status === "calculated" && <FaraidModelResult model={model} featureEnabled={isTestamentPreparationEnabled()} />}
          </>
        )}
      </Card>

      <Card>
        <CardTitle className="text-base">3. Angaben für das deutsche Recht</CardTitle>
        <dl className="text-sm grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          {facts.map((s) => (
            <div key={s.id} className="contents">
              <dt className="text-muted">{s.question}</dt>
              <dd>{s.options?.find((o) => o.value === readStepValue(prep, s))?.label ?? (readStepValue(prep, s) || "—")}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <Card data-testid="preparation-lawyer-questions">
        <CardTitle className="text-base">4. Fragen an Anwalt oder Notar</CardTitle>
        <ul className="list-disc pl-5 text-sm space-y-1">
          {questions.map((q) => (
            <li key={q.id}>
              {q.question}
              {q.reference && <span className="text-muted"> ({q.reference})</span>}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardTitle className="text-base">5. Rechtlich freigegebene Dokumente</CardTitle>
        <p className="text-sm text-muted">Keine. Mein Wille erstellt keine Testamente und prüft keine Rechtslage.</p>
      </Card>

      <div className="flex flex-wrap gap-2 no-print">
        <Button type="button" variant="outline" size="sm" onClick={onEdit}>Antworten ändern</Button>
        <Button type="button" variant="outline" size="sm" onClick={() => window.print()}>
          <Printer size={14} className="mr-1" aria-hidden /> Gesprächsunterlage drucken
        </Button>
      </div>
    </div>
  );
}
