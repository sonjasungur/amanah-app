"use client";

import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { getAllModuleProgress } from "@/lib/utils/progress";
import { getDashboardGreeting } from "@/lib/plan/greeting";
import { getPlanNextStep, getPrioritizedPlanItems } from "@/lib/plan/next-step";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { ModuleTiles } from "@/components/dashboard/module-tiles";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { AlertTriangle, ArrowRight, CheckCircle2, Shield } from "lucide-react";
import { getCriticalMissing } from "@/lib/utils/progress";

export default function DashboardPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const { t } = useI18n();
  const critical = getCriticalMissing(data);
  const nextStep = getPlanNextStep(data);
  const planItems = getPrioritizedPlanItems(data, 3);
  const moduleProgress = getAllModuleProgress(data);
  const greeting = getDashboardGreeting(store.emergencyCard.name || store.userProfile.name);

  const overallPercent = moduleProgress.length
    ? Math.round(moduleProgress.reduce((s, m) => s + m.percent, 0) / moduleProgress.length)
    : 0;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-br from-accent-soft via-card to-emerald/5 border-2 border-emerald/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-emerald font-semibold text-sm mb-1">Assalamu alaikum</p>
            <h1 className="text-page-title font-bold text-foreground" data-testid="dashboard-greeting">
              {greeting}
            </h1>
            <p className="text-sm text-muted mt-2">Mein Vorsorgeplan</p>
          </div>
          <SaveStatusIndicator className="shrink-0" />
        </div>
        <p className="text-body text-muted mb-5 max-w-xl leading-relaxed">
          {overallPercent >= 70
            ? "Gute Basis — halte deine gespeicherten Angaben aktuell."
            : "Schritt für Schritt vorbereiten — zur Orientierung, ohne Garantie auf Vollständigkeit."}
        </p>
        <ProgressBar />
      </header>

      <Card className="border-2 border-emerald/30 bg-accent-soft p-6 md:p-7 shadow-sm" data-testid="dashboard-next-step">
        <CardTitle className="text-card-title mb-2 text-primary">{t("dashboard.next")}</CardTitle>
        <p className="text-lg font-semibold text-foreground mb-2">{nextStep.title}</p>
        <p className="text-body text-muted mb-5">{nextStep.reason}</p>
        <Link href={nextStep.path}>
          <Button type="button" size="lg" data-testid="dashboard-next-step-cta">
            Diesen Schritt jetzt erledigen <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </Card>

      {planItems.length > 0 && (
        <Card className="p-6">
          <CardTitle className="text-base mb-3">Deine nächsten Planpunkte</CardTitle>
          <ul className="space-y-2">
            {planItems.map((item) => (
              <li key={item.id}>
                <Link
                  href={item.path}
                  className="flex items-center justify-between gap-3 text-sm py-2 min-h-[44px] hover:text-accent"
                >
                  <span>{item.title}</span>
                  <span className="text-muted font-medium">{item.percent}%</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <ModuleTiles />

      {critical.length > 0 && (
        <Card className="border-warning/40 bg-warning/5 p-6">
          <CardTitle className="flex items-center gap-2 text-warning text-base">
            <AlertTriangle size={18} /> {t("dashboard.critical")}
          </CardTitle>
          <ul className="space-y-1 mt-2">
            {critical.slice(0, 3).map((item) => (
              <li key={item} className="text-sm text-muted flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-warning shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-4 flex items-start gap-3 bg-accent-soft/80 border border-border">
        <Shield size={20} className="text-primary shrink-0 mt-0.5" aria-hidden />
        <p className="text-sm text-muted leading-relaxed">
          Angaben in deinem Ordner werden lokal auf diesem Gerät gespeichert. Teile sensible Inhalte nur mit Vertrauenspersonen. Keine Rechts- oder Fatwa-Beratung.
        </p>
      </Card>

      {overallPercent >= 100 && (
        <p className="text-sm text-success flex items-center gap-2">
          <CheckCircle2 size={16} /> Alle Bereiche bearbeitet — regelmäßig aktualisieren.
        </p>
      )}
    </div>
  );
}
