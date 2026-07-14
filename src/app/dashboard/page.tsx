"use client";

import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { moduleConfigs } from "@/lib/modules/config";
import { getAllModuleProgress, getCriticalMissing, getRecommendedNextStep } from "@/lib/utils/progress";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { AlertTriangle, ArrowRight, CheckCircle2, Compass, Shield } from "lucide-react";

export default function DashboardPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const { t } = useI18n();
  const critical = getCriticalMissing(data);
  const nextStep = getRecommendedNextStep(data);
  const moduleProgress = getAllModuleProgress(data);
  const greeting = store.emergencyCard.name || store.userProfile.name || "dort";

  const openTasks = moduleProgress
    .filter((m) => m.percent < 80)
    .sort((a, b) => a.percent - b.percent)
    .slice(0, 3);
  const modById = Object.fromEntries(moduleConfigs.map((m) => [m.id, m]));
  const overallPercent = moduleProgress.length
    ? Math.round(moduleProgress.reduce((s, m) => s + m.percent, 0) / moduleProgress.length)
    : 0;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl bg-gradient-to-br from-accent-soft via-card to-emerald/5 border-2 border-emerald/20 p-6 md:p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-3">
          <div>
            <p className="text-emerald font-semibold text-sm mb-1">Assalamu alaikum</p>
            <h1 className="text-page-title font-bold text-foreground">Willkommen, {greeting}</h1>
          </div>
          <SaveStatusIndicator className="shrink-0" />
        </div>
        <p className="text-body text-muted mb-5 max-w-xl leading-relaxed">
          {overallPercent >= 70
            ? "Gute Basis — halte deinen Ordner aktuell."
            : "Schritt für Schritt vorbereiten — zur Orientierung, ohne Garantie auf Vollständigkeit."}
        </p>
        <ProgressBar />
      </header>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-2 border-emerald/30 bg-accent-soft p-6 md:p-7 shadow-sm">
          <CardTitle className="text-card-title mb-2 text-primary">{t("dashboard.next")}</CardTitle>
          <p className="text-body text-muted mb-5">{nextStep.title}</p>
          <Link href={nextStep.path}>
            <Button type="button" size="lg">
              Weiter <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </Card>

        <Card className="p-6 md:p-7 border border-border shadow-sm">
          <CardTitle className="text-card-title mb-2">Vorsorge-Check</CardTitle>
          <p className="text-body text-muted mb-5">15 Fragen — wo stehst du wirklich?</p>
          <Link href="/check">
            <Button variant="secondary" type="button">Vorsorge-Check starten</Button>
          </Link>
        </Card>
      </div>

      {openTasks.length > 0 && (
        <Card className="p-6">
          <CardTitle className="text-base mb-3">Offene Aufgaben (max. 3)</CardTitle>
          <ul className="space-y-2">
            {openTasks.map((m) => (
              <li key={m.moduleId}>
                <Link
                  href={modById[m.moduleId]?.path ?? "/dashboard"}
                  className="flex items-center justify-between gap-3 text-sm py-2 min-h-[44px] hover:text-accent"
                >
                  <span>{modById[m.moduleId]?.title ?? m.moduleId}</span>
                  <span className="text-muted font-medium">{m.percent}%</span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/dashboard/ausfuellen" className="inline-block mt-3 text-sm text-accent hover:underline">
            <Compass size={14} className="inline mr-1" /> Geführt ausfüllen
          </Link>
        </Card>
      )}

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
          Daten werden lokal auf deinem Gerät gespeichert. Teile sensible Inhalte nur mit Vertrauenspersonen. Keine Rechts- oder Fatwa-Beratung.
        </p>
      </Card>

      {overallPercent >= 100 && (
        <p className="text-sm text-success flex items-center gap-2">
          <CheckCircle2 size={16} /> Alle Module bearbeitet — regelmäßig aktualisieren.
        </p>
      )}
    </div>
  );
}
