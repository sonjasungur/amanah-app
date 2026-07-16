"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ModuleForm } from "@/components/modules/module-form";
import { JanazahLegalNotice } from "@/components/modules/janazah-legal-notice";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { janazahSections } from "@/lib/modules/janazah-sections";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { CheckCircle2 } from "lucide-react";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path];
  const [first, ...rest] = path.split(".");
  const nested = obj[first] as Record<string, unknown>;
  return getNestedValue(nested, rest.join("."));
}

function setNestedValue(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
  if (!path.includes(".")) return { ...obj, [path]: value };
  const [first, ...rest] = path.split(".");
  return {
    ...obj,
    [first]: setNestedValue((obj[first] as Record<string, unknown>) || {}, rest.join("."), value),
  };
}

export function JanazahWishesForm() {
  const store = useAmanahStore();
  const values = store.janazahWishes as unknown as Record<string, unknown>;
  const profileBirthDate = store.userProfile.birthDate?.trim();
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const visibleSections = useMemo(
    () =>
      janazahSections.map((section) => ({
        ...section,
        fields: section.fields.filter(
          (field) => !field.showWhenProfileBirthDateEmpty || !profileBirthDate
        ),
      })),
    [profileBirthDate]
  );

  const flatValues: Record<string, unknown> = {};
  for (const section of visibleSections) {
    for (const field of section.fields) {
      flatValues[field.key] = getNestedValue(values, field.key);
    }
  }

  const handleChange = (field: string, value: unknown) => {
    const updated = setNestedValue(values, field, value);
    store.updateField("janazahWishes", updated as never);
    setValidationError(null);
  };

  useEffect(() => {
    if (store.saveStatus !== "saved" || !store.lastSaved) return;
    const timer = setTimeout(() => setShowSavedBanner(true), 450);
    return () => clearTimeout(timer);
  }, [store.saveStatus, store.lastSaved]);

  const handleExplicitSave = () => {
    if (store.saveStatus === "error") {
      setValidationError("Speichern fehlgeschlagen. Bitte erneut versuchen.");
      return;
    }
    setValidationError(null);
    if (store.saveStatus === "saved") {
      setShowSavedBanner(true);
    }
  };

  return (
    <div data-testid="janazah-form">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page-title font-bold text-foreground mb-2">Janazah-Wünsche</h1>
          <p className="text-body text-muted max-w-2xl leading-relaxed">
            Halte deine islamischen Bestattungswünsche fest — damit deine Familie im schwersten Moment weiß, was zu tun ist.
          </p>
        </div>
        <SaveStatusIndicator className="shrink-0" />
      </div>

      <JanazahLegalNotice className="mb-6" />

      {showSavedBanner && store.saveStatus === "saved" && (
        <div
          className="mb-6 flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground"
          data-testid="janazah-save-success"
          role="status"
        >
          <CheckCircle2 size={18} className="text-success shrink-0 mt-0.5" aria-hidden />
          <p>Deine Janazah-Wünsche wurden gespeichert. Du kannst sie jederzeit ergänzen oder ändern.</p>
        </div>
      )}

      {validationError && (
        <p className="mb-4 text-sm text-danger" data-testid="janazah-validation-error" role="alert">
          {validationError}
        </p>
      )}

      <div className="space-y-6">
        {visibleSections.map((section) => (
          <Card key={section.id} className="border-2 border-border/80 shadow-sm" data-testid={`janazah-section-${section.id}`}>
            <CardTitle className="text-card-title text-primary-dark">{section.title}</CardTitle>
            <p className="text-sm text-muted mt-1 mb-5">{section.description}</p>
            <ModuleForm section="janazahWishes" fields={section.fields} values={flatValues} onChange={handleChange} />
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button type="button" size="lg" className="w-full sm:w-auto" onClick={handleExplicitSave} data-testid="janazah-save-button">
          Wünsche speichern
        </Button>
        <Link href="/register" className="w-full sm:w-auto">
          <Button type="button" variant="outline" size="lg" className="w-full">
            Konto erstellen — dauerhaft sichern
          </Button>
        </Link>
      </div>
    </div>
  );
}
