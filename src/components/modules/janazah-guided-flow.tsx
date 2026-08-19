"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ModuleForm } from "@/components/modules/module-form";
import { JanazahLegalNotice } from "@/components/modules/janazah-legal-notice";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { getJanazahSections, janazahSections } from "@/lib/modules/janazah-sections";
import { flushPendingSave } from "@/lib/storage/store-sync";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { useI18n } from "@/lib/i18n/context";
import { AlertCircle, ArrowLeft, ArrowRight, Eye } from "lucide-react";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path];
  const [first, ...rest] = path.split(".");
  const nested = obj[first] as Record<string, unknown>;
  return getNestedValue(nested, rest.join("."));
}

function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  if (!path.includes(".")) return { ...obj, [path]: value };
  const [first, ...rest] = path.split(".");
  return {
    ...obj,
    [first]: setNestedValue(
      (obj[first] as Record<string, unknown>) || {},
      rest.join("."),
      value
    ),
  };
}

function isSectionComplete(
  sectionId: string,
  values: Record<string, unknown>
): boolean {
  const criticalFieldsBySection: Record<string, string[]> = {
    grunddaten: ["fullName", "trustedContact"],
    benachrichtigung: [],
    "ghusl-janazah": ["islamicBurialDesired"],
    beisetzung: [],
    persoenlich: [],
  };
  const criticalFields = criticalFieldsBySection[sectionId] ?? [];
  return criticalFields.every((field) => {
    const v = getNestedValue(values, field);
    return v !== undefined && v !== null && v !== "";
  });
}

function getInitialStep(values: Record<string, unknown>): number {
  for (let i = 0; i < janazahSections.length; i++) {
    if (!isSectionComplete(janazahSections[i].id, values)) return i;
  }
  return 0;
}

interface JanazahGuidedFlowProps {
  initialStep?: number;
}

export function JanazahGuidedFlow({ initialStep }: JanazahGuidedFlowProps) {
  const store = useAmanahStore();
  const router = useRouter();
  const { locale, t } = useI18n();
  const values = store.janazahWishes as unknown as Record<string, unknown>;
  const profileBirthDate = store.userProfile.birthDate?.trim();

  const sections = getJanazahSections(locale);

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (initialStep !== undefined) return Math.min(Math.max(0, initialStep), janazahSections.length - 1);
    return getInitialStep(values);
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const visibleSections = sections.map((section) => ({
    ...section,
    fields: section.fields.filter(
      (field) => !field.showWhenProfileBirthDateEmpty || !profileBirthDate
    ),
  }));

  const totalSteps = visibleSections.length;
  const section = visibleSections[currentStep];

  const flatValues: Record<string, unknown> = {};
  for (const sec of visibleSections) {
    for (const field of sec.fields) {
      flatValues[field.key] = getNestedValue(values, field.key);
    }
  }

  const handleChange = useCallback(
    (field: string, value: unknown) => {
      const updated = setNestedValue(values, field, value);
      store.updateField("janazahWishes", updated as never);
      setSaveErrorMsg(null);
    },
    [values, store]
  );

  const handleNext = async () => {
    setIsSaving(true);
    setSaveErrorMsg(null);
    await flushPendingSave();
    const status = useAmanahStore.getState().saveStatus;
    setIsSaving(false);
    if (status === "error") {
      setSaveErrorMsg(t("storage.status.error"));
      return;
    }
    setCurrentStep((s) => Math.min(s + 1, totalSteps - 1));
  };

  const handleBack = () => {
    setSaveErrorMsg(null);
    setCurrentStep((s) => Math.max(s - 1, 0));
  };

  const handlePreview = async () => {
    setIsSaving(true);
    setSaveErrorMsg(null);
    await flushPendingSave();
    const status = useAmanahStore.getState().saveStatus;
    setIsSaving(false);
    if (status === "error") {
      setSaveErrorMsg(t("storage.status.error"));
      return;
    }
    router.push("/dashboard/janazah/vorschau");
  };

  const isLastStep = currentStep === totalSteps - 1;
  const progressPercent = Math.round(((currentStep + 1) / totalSteps) * 100);

  return (
    <div data-testid="janazah-guided-flow">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page-title font-bold text-foreground mb-2">{t("janazah.title")}</h1>
          <p className="text-body text-muted max-w-2xl leading-relaxed">
            {t("janazah.subtitle")}
          </p>
        </div>
        <SaveStatusIndicator className="shrink-0" />
      </div>

      <div
        className="mb-6"
        data-testid="janazah-step-progress"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={`${t("common.step")} ${currentStep + 1} ${t("common.of")} ${totalSteps}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-foreground">
            {t("common.step")} {currentStep + 1} {t("common.of")} {totalSteps}
          </span>
          <span className="text-sm text-muted">{section.title}</span>
        </div>
        <div className="h-2 rounded-full bg-border overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex gap-1.5 mt-2">
          {visibleSections.map((s, i) => (
            <div
              key={s.id}
              className={`h-1 flex-1 rounded-full transition-colors ${
                i <= currentStep ? "bg-primary" : "bg-border"
              }`}
            />
          ))}
        </div>
      </div>

      {currentStep === 0 && <JanazahLegalNotice className="mb-6" />}

      <div data-testid={`janazah-step-${currentStep}`}>
        <Card className="border-2 border-border/80 shadow-sm">
          <CardTitle className="text-card-title text-primary-dark">{section.title}</CardTitle>
          <p className="text-sm text-muted mt-1 mb-5">{section.description}</p>
          <ModuleForm
            section="janazahWishes"
            fields={section.fields}
            values={flatValues}
            onChange={handleChange}
          />
        </Card>
      </div>

      {saveErrorMsg && (
        <div
          className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle size={16} className="shrink-0 mt-0.5" aria-hidden />
          <p>{saveErrorMsg}</p>
        </div>
      )}

      <div className="mt-6 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <Link href="/dashboard" className="order-last sm:order-first">
          <Button type="button" variant="ghost" size="sm">
            <ArrowLeft size={14} className="mr-1.5" aria-hidden />
            {t("nav.backToPlan")}
          </Button>
        </Link>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          {currentStep > 0 && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleBack}
              data-testid="janazah-back-button"
            >
              <ArrowLeft size={16} className="mr-1.5" aria-hidden />
              {t("common.back")}
            </Button>
          )}

          {isLastStep ? (
            <Button
              type="button"
              size="lg"
              onClick={() => void handlePreview()}
              disabled={isSaving}
              data-testid="janazah-preview-button"
            >
              <Eye size={16} className="mr-1.5" aria-hidden />
              {isSaving ? t("storage.status.saving") : t("janazah.guided.previewCheck")}
            </Button>
          ) : (
            <Button
              type="button"
              size="lg"
              onClick={() => void handleNext()}
              disabled={isSaving}
              data-testid="janazah-next-button"
            >
              {isSaving ? t("storage.status.saving") : t("janazah.guided.saveAndNext")}
              {!isSaving && <ArrowRight size={16} className="ml-1.5" aria-hidden />}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
