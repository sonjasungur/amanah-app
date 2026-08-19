"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { getJanazahSections } from "@/lib/modules/janazah-sections";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Download, MessageSquare, ArrowLeft, Pencil } from "lucide-react";

function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  if (!path.includes(".")) return obj[path];
  const [first, ...rest] = path.split(".");
  const nested = obj[first] as Record<string, unknown>;
  return getNestedValue(nested, rest.join("."));
}

function formatValue(value: unknown, tFn: (key: string) => string): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value ? tFn("common.yes") : tFn("common.no");
  if (typeof value === "string") return value.trim() || null;
  return String(value);
}

const CRITICAL_FIELDS = new Set([
  "fullName",
  "trustedContact",
  "islamicBurialDesired",
  "preferredMosque",
  "preferredCemetery",
  "mosqueCommunity",
]);

export default function JanazahVorschauPage() {
  const store = useAmanahStore();
  const router = useRouter();
  const { locale, t } = useI18n();
  const values = store.janazahWishes as unknown as Record<string, unknown>;
  const profileBirthDate = store.userProfile.birthDate?.trim();

  const sections = getJanazahSections(locale);

  const visibleSections = sections.map((section) => ({
    ...section,
    fields: section.fields.filter(
      (field) => !field.showWhenProfileBirthDateEmpty || !profileBirthDate
    ),
  }));

  const handleDownload = () => {
    router.push("/dashboard/pdf");
  };

  return (
    <div data-testid="janazah-preview">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-page-title font-bold text-foreground mb-2">{t("janazah.preview.title")}</h1>
          <p className="text-body text-muted max-w-2xl leading-relaxed">
            {t("janazah.preview.subtitle")}
          </p>
        </div>
      </div>

      <aside className="mb-6 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted leading-relaxed">
        {t("janazah.preview.disclaimer")}
      </aside>

      <div className="space-y-6">
        {visibleSections.map((section, sectionIndex) => {
          const filledFields = section.fields.filter((field) => {
            const value = getNestedValue(values, field.key);
            return formatValue(value, t) !== null;
          });
          const missingCritical = section.fields.filter((field) => {
            return CRITICAL_FIELDS.has(field.key) && formatValue(getNestedValue(values, field.key), t) === null;
          });

          return (
            <Card
              key={section.id}
              className="border-2 border-border/80 shadow-sm"
              data-testid={`janazah-preview-section-${section.id}`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <CardTitle className="text-card-title text-primary-dark">{section.title}</CardTitle>
                  <p className="text-sm text-muted mt-1">{section.description}</p>
                </div>
                <Link href={`/dashboard/janazah?schritt=${sectionIndex}`}>
                  <Button type="button" variant="outline" size="sm">
                    <Pencil size={14} className="mr-1.5" aria-hidden />
                    {t("common.edit")}
                  </Button>
                </Link>
              </div>

              {missingCritical.length > 0 && (
                <div className="mb-4 flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 px-3 py-2 text-sm text-foreground">
                  <AlertTriangle size={15} className="shrink-0 mt-0.5 text-warning" aria-hidden />
                  <div>
                    <p className="font-medium text-warning mb-1">{t("common.notYetProvided")}</p>
                    <ul className="space-y-0.5 text-muted text-xs">
                      {missingCritical.map((f) => (
                        <li key={f.key}>{f.label}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {filledFields.length === 0 && missingCritical.length === 0 ? (
                <p className="text-sm text-muted italic">{t("janazah.preview.noEntries")}</p>
              ) : (
                <dl className="space-y-3">
                  {filledFields.map((field) => {
                      const raw = getNestedValue(values, field.key);
                    const displayValue = formatValue(raw, t);
                    if (!displayValue) return null;
                    return (
                      <div key={field.key} className="flex flex-col sm:flex-row sm:gap-4">
                        <dt className="text-sm font-medium text-foreground sm:w-2/5 shrink-0">{field.label}</dt>
                        <dd className="text-sm text-muted mt-0.5 sm:mt-0 sm:w-3/5 whitespace-pre-wrap">{displayValue}</dd>
                      </div>
                    );
                  })}
                </dl>
              )}
            </Card>
          );
        })}
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <Button
          type="button"
          size="lg"
          onClick={handleDownload}
          data-testid="janazah-preview-download"
        >
          <Download size={16} className="mr-1.5" aria-hidden />
          {t("janazah.preview.openPdf")}
        </Button>
        <Link href="/dashboard/familiengespraech">
          <Button type="button" variant="outline" size="lg" className="w-full sm:w-auto">
            <MessageSquare size={16} className="mr-1.5" aria-hidden />
            {t("janazah.preview.discussWithFamily")}
          </Button>
        </Link>
        <Link href="/dashboard" data-testid="janazah-preview-back">
          <Button type="button" variant="ghost" size="lg" className="w-full sm:w-auto">
            <ArrowLeft size={16} className="mr-1.5" aria-hidden />
            {t("nav.backToPlan")}
          </Button>
        </Link>
      </div>
    </div>
  );
}
