"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, PauseCircle } from "lucide-react";
import { useAmanahStore, cancelPendingSave } from "@/lib/store/use-amanah-store";
import { flushPendingSave } from "@/lib/storage/store-sync";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { emergencyCardFields, medicalFields, powerOfAttorneyFields } from "@/lib/modules/fields";
import { COMPLETION_PATH, FLOW_STEPS, flowHref, flowStepIndex, type FlowStep } from "@/lib/vorsorge/flow";
import { getArea } from "@/lib/vorsorge/areas";
import { SectionFields } from "@/components/vorsorge/section-fields";
import { PeopleEditor } from "@/components/vorsorge/people-editor";
import { PersonPicker } from "@/components/vorsorge/person-picker";
import { DocumentChecklist } from "@/components/vorsorge/document-checklist";
import { DebtsEditor } from "@/components/vorsorge/debts-editor";
import { DigitalLegacyEditor } from "@/components/vorsorge/digital-legacy-editor";
import { AssetOverview } from "@/components/testament/asset-overview";
import { SaveBar } from "@/components/storage/save-bar";

const contactFields = emergencyCardFields.filter((f) => f.key.startsWith("emergencyContact"));
const attorneyFields = powerOfAttorneyFields
  .filter((f) => f.key === "authorizedPerson" || f.key === "substitutePerson")
  .map((f) => ({ ...f, label: f.key === "authorizedPerson" ? "Vorgesehene Person (Name)" : "Ersatzperson (Name)" }));
const documentStatusFields = emergencyCardFields.filter((f) => f.key === "hasPatientenverfuegung" || f.key === "hasVorsorgevollmacht");
const documentLocationField = medicalFields.filter((f) => f.key === "documentLocation");

function StepBody({ step }: { step: FlowStep }) {
  switch (step.kind) {
    case "fields":
      return <SectionFields section={step.section!} fields={step.fields!} />;
    case "people":
      return <PeopleEditor />;
    case "contacts":
      return (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <PersonPicker field="emergencyContact1" label="Erster Notfallkontakt" />
            <PersonPicker field="emergencyContact2" label="Zweiter Notfallkontakt" />
          </div>
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium min-h-[44px] flex items-center">Kontakte direkt eintragen oder ändern</summary>
            <div className="mt-4">
              <SectionFields section="emergencyCard" fields={contactFields} />
            </div>
          </details>
        </div>
      );
    case "attorney":
      return (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <PersonPicker field="authorizedPerson" label="Vorgesehene Person" />
            <PersonPicker field="substitutePerson" label="Ersatzperson" />
          </div>
          <details className="rounded-xl border border-border p-4">
            <summary className="cursor-pointer font-medium min-h-[44px] flex items-center">Namen direkt eintragen oder ändern</summary>
            <div className="mt-4">
              <SectionFields section="powerOfAttorney" fields={attorneyFields} />
            </div>
          </details>
          <SectionFields section="emergencyCard" fields={documentStatusFields} />
          <SectionFields section="medicalWishes" fields={documentLocationField} />
        </div>
      );
    case "documents":
      return <DocumentChecklist />;
    case "assets":
      return <AssetOverview />;
    case "debts":
      return <DebtsEditor />;
    case "digital":
      return <DigitalLegacyEditor />;
  }
}

/** The guided Vorsorge: one step per screen, nothing required, every value saved where the pages keep it. */
export function VorsorgeFlow({ stepId }: { stepId: string | null }) {
  const router = useRouter();
  const meta = useAmanahStore((s) => s.vorsorgeMeta);
  const updateField = useAmanahStore((s) => s.updateField);
  const heading = useRef<HTMLHeadingElement>(null);

  const index = flowStepIndex(stepId ?? meta.flowStep);
  const step = FLOW_STEPS[index];
  const area = getArea(step.area);
  const total = FLOW_STEPS.length;
  const isLast = index === total - 1;

  useEffect(() => {
    if (stepId) heading.current?.focus({ preventScroll: true });
  }, [stepId]);

  const saveNow = () => {
    cancelPendingSave();
    void flushPendingSave();
  };

  const rememberStep = (nextStep: string | null, pausedAt: string | null = null) => {
    const current = useAmanahStore.getState().vorsorgeMeta;
    if (current.flowStep === nextStep && current.flowPausedAt === pausedAt) return;
    updateField("vorsorgeMeta", { ...current, flowStep: nextStep, flowPausedAt: pausedAt });
  };

  const goTo = (target: number) => {
    // A paused flow follows the person, so "Fortsetzen" on the dashboard stays right.
    if (meta.flowStep) rememberStep(FLOW_STEPS[target].id, meta.flowPausedAt);
    router.push(flowHref(FLOW_STEPS[target].id));
    window.scrollTo({ top: 0 });
  };

  const next = () => {
    if (isLast) {
      rememberStep(null);
      saveNow();
      router.push(COMPLETION_PATH);
      return;
    }
    goTo(index + 1);
    saveNow();
  };

  const later = () => {
    rememberStep(step.id, new Date().toISOString());
    saveNow();
    router.push("/dashboard");
  };

  const percent = Math.round(((index + 1) / total) * 100);

  return (
    <div className="max-w-3xl space-y-6" data-testid="vorsorge-flow">
      <div>
        <p className="text-sm text-muted" data-testid="flow-step-count">
          Schritt {index + 1} von {total} · {area.title}
        </p>
        <div
          className="mt-2 h-2 rounded-full bg-border overflow-hidden"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={total}
          aria-valuenow={index + 1}
          aria-label={`Schritt ${index + 1} von ${total}`}
        >
          <div className="h-full bg-emerald rounded-full transition-all" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <Card className="p-5 md:p-7">
        <h1 ref={heading} tabIndex={-1} className="text-2xl font-bold text-primary mb-2 outline-none" data-testid="flow-step-title">
          {step.title}
        </h1>
        <p className="text-muted mb-6 max-w-2xl">{step.help}</p>
        <StepBody step={step} />
      </Card>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between no-print">
        <div className="flex gap-3">
          <Button type="button" variant="ghost" onClick={() => goTo(index - 1)} disabled={index === 0} data-testid="flow-back">
            <ArrowLeft size={16} className="mr-2" aria-hidden /> Zurück
          </Button>
          <Button type="button" variant="outline" onClick={later} data-testid="flow-later">
            <PauseCircle size={16} className="mr-2" aria-hidden /> Später fortsetzen
          </Button>
        </div>
        <Button type="button" size="lg" onClick={next} data-testid="flow-next">
          {isLast ? "Speichern und zur Zusammenfassung" : "Speichern und weiter"} <ArrowRight size={16} className="ml-2" aria-hidden />
        </Button>
      </div>
      <SaveBar compact className="mt-0" />
      <p className="text-xs text-muted">
        Alle Angaben sind freiwillig. Du kannst jeden Schritt überspringen und später auf der Seite{" "}
        <Link href={area.pages[0].path} className="underline">
          {area.pages[0].title}
        </Link>{" "}
        ergänzen.
      </p>
    </div>
  );
}
