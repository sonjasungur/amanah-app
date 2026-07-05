"use client";

import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { moduleConfigs } from "@/lib/modules/config";
import { getAllModuleProgress, getCriticalMissing, getRecommendedNextStep } from "@/lib/utils/progress";
import { exportEmergencyFolder } from "@/lib/storage/amanah-storage";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { AiDashboardCard } from "@/components/ai/ai-dashboard-card";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";
import { StorageControls } from "@/components/storage/storage-controls";
import { PathSelector } from "@/components/onboarding/path-selector";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";
import { AlertTriangle, ArrowRight, Bot, Download, FileText, Heart } from "lucide-react";

export default function DashboardPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const { t } = useI18n();
  const critical = getCriticalMissing(data);
  const nextStep = getRecommendedNextStep(data);
  const moduleProgress = getAllModuleProgress(data);
  const greeting = store.emergencyCard.name || store.userProfile.name || "dort";

  const progressMap = Object.fromEntries(moduleProgress.map((m) => [m.moduleId, m.percent]));

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/10 p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
          <div>
            <p className="text-accent font-medium text-sm mb-1">Assalamu alaikum</p>
            <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
              Willkommen, {greeting}
            </h1>
          </div>
          <SaveStatusIndicator className="shrink-0" />
        </div>
        <p className="text-muted mb-6">
          Dein AmanahOrdner hilft dir, Wünsche und Pflichten geordnet vorzubereiten — zur Orientierung, ohne Garantie auf Vollständigkeit oder rechtliche Wirksamkeit.
        </p>
        <ProgressBar />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/dashboard/assistent">
          <Button variant="secondary">
            <Bot size={18} className="mr-2" /> Assistent
          </Button>
        </Link>
        <Link href="/dashboard/pdf">
          <Button variant="outline">
            <FileText size={18} className="mr-2" /> PDF & Export
          </Button>
        </Link>
        <Link href="/dashboard/notfallkarte">
          <Button variant="outline">
            <Heart size={18} className="mr-2" /> Notfallkarte
          </Button>
        </Link>
        <Button variant="outline" onClick={() => exportEmergencyFolder(data)}>
          <Download size={18} className="mr-2" /> {t("storage.emergencyExport")}
        </Button>
      </div>

      {critical.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle size={20} /> {t("dashboard.critical")}
          </CardTitle>
          <p className="text-xs text-muted mt-1">{t("validation.criticalHint")}</p>
          <ul className="space-y-2 mt-3">
            {critical.map((item) => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardTitle>{t("dashboard.next")}</CardTitle>
        <p className="text-muted text-sm mb-4">
          Basierend auf deinem gewählten Weg und deinem Fortschritt — fachliche Prüfung empfohlen.
        </p>
        <Link href={nextStep.path}>
          <Button>
            {nextStep.title} <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </Card>

      <AiDashboardCard />

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Alle Module</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {moduleConfigs.map((mod) => {
            const pct = progressMap[mod.id] ?? 0;
            return (
              <Link key={mod.id} href={mod.path}>
                <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all group">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{mod.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-semibold text-primary group-hover:text-primary-light transition-colors">
                          {mod.title}
                        </h3>
                        <span className="text-xs font-bold text-primary shrink-0">{pct}%</span>
                      </div>
                      <p className="text-sm text-muted mt-1">{mod.description}</p>
                      <div className="h-1.5 bg-sand rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full bg-primary/70 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {!store.selectedPath && (
        <section className="rounded-2xl border border-dashed border-primary/20 p-6">
          <h2 className="text-lg font-bold text-primary text-center mb-2">
            Noch kein Startweg gewählt?
          </h2>
          <p className="text-sm text-muted text-center mb-6">
            Wähle, womit du beginnen möchtest — du kannst jederzeit alle Module nutzen.
          </p>
          <PathSelector />
        </section>
      )}

      {store.selectedPath && (
        <div className="text-center">
          <Link href="/" className="text-sm text-primary hover:underline">
            Startweg ändern →
          </Link>
        </div>
      )}

      <div className="lg:hidden">
        <StorageControls />
      </div>
    </div>
  );
}
