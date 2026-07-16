"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ModuleForm } from "@/components/modules/module-form";
import { JanazahLegalNotice } from "@/components/modules/janazah-legal-notice";
import { JanazahModuleNav } from "@/components/modules/janazah-module-nav";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { janazahSections } from "@/lib/modules/janazah-sections";
import { buildAuthHref } from "@/lib/auth/return-url";
import { flushPendingSave, getStorageLocationLabel } from "@/lib/storage/store-sync";
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

function getSavedConfirmationMessage(): string {
  return getStorageLocationLabel() === "api"
    ? "Deine Janazah-Wünsche wurden in deinem Konto gespeichert."
    : "Deine Änderungen wurden auf diesem Gerät gespeichert.";
}

export function JanazahWishesForm() {
  const store = useAmanahStore();
  const pathname = usePathname();
  const values = store.janazahWishes as unknown as Record<string, unknown>;
  const profileBirthDate = store.userProfile.birthDate?.trim();
  const [showSavedBanner, setShowSavedBanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const visibleSections = janazahSections.map((section) => ({
    ...section,
    fields: section.fields.filter(
      (field) => !field.showWhenProfileBirthDateEmpty || !profileBirthDate
    ),
  }));

  const flatValues: Record<string, unknown> = {};
  for (const section of visibleSections) {
    for (const field of section.fields) {
      flatValues[field.key] = getNestedValue(values, field.key);
    }
  }

  const handleChange = (field: string, value: unknown) => {
    const updated = setNestedValue(values, field, value);
    store.updateField("janazahWishes", updated as never);
    setShowSavedBanner(false);
  };

  const handleExplicitSave = async () => {
    setIsSaving(true);
    setShowSavedBanner(false);
    await flushPendingSave();
    setIsSaving(false);
    const status = useAmanahStore.getState().saveStatus;
    if (status === "saved") {
      setShowSavedBanner(true);
    }
  };

  return (
    <div data-testid="janazah-form">
      <JanazahModuleNav />

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
          <p>{getSavedConfirmationMessage()}</p>
        </div>
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
        <Button
          type="button"
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => void handleExplicitSave()}
          disabled={isSaving || store.saveStatus === "saving"}
          data-testid="janazah-save-button"
        >
          {isSaving || store.saveStatus === "saving" ? "Speichern …" : "Wünsche speichern"}
        </Button>
        <Link href={buildAuthHref("/register", pathname)} className="w-full sm:w-auto">
          <Button type="button" variant="outline" size="lg" className="w-full">
            Konto erstellen — geräteübergreifend sichern
          </Button>
        </Link>
        <Link href="/dashboard/pdf" className="w-full sm:w-auto">
          <Button type="button" variant="ghost" size="lg" className="w-full">
            Export & Backup
          </Button>
        </Link>
      </div>
    </div>
  );
}
