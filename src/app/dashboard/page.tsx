"use client";

import Link from "next/link";
import { ArrowRight, Package } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { getDashboardGreeting } from "@/lib/plan/greeting";
import { getAllAreaStates } from "@/lib/vorsorge/areas";
import { COMPLETION_PATH, getVorsorgeNextStep } from "@/lib/vorsorge/flow";
import { AreaList } from "@/components/vorsorge/area-list";
import { ModuleTiles } from "@/components/dashboard/module-tiles";
import { Card, CardTitle } from "@/components/ui/card";
import { linkButtonClassName } from "@/components/ui/button";

export default function DashboardPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const greeting = getDashboardGreeting(store.emergencyCard.name || store.userProfile.name);
  const states = getAllAreaStates(data);
  const next = getVorsorgeNextStep(data);
  const complete = states.filter((s) => s.status === "vollstaendig").length;
  const started = states.filter((s) => s.status !== "nicht_begonnen").length;

  return (
    <div className="space-y-6">
      <header>
        <p className="text-emerald font-semibold text-sm mb-1">Assalamu alaikum</p>
        <h1 className="text-page-title font-bold text-foreground" data-testid="dashboard-greeting">
          {greeting}
        </h1>
        <p className="text-body text-muted mt-2 max-w-2xl" data-testid="dashboard-summary">
          {complete} von {states.length} Bereichen mit vollständigen Angaben
          {started > complete ? `, ${started - complete} begonnen` : ""}. Der Status hilft dir beim Ordnen. Über rechtliche
          Wirksamkeit sagt er nichts.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="space-y-6 min-w-0">
          <Card className="border-2 border-emerald/30 bg-accent-soft p-5 md:p-6" data-testid="dashboard-next-step">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">Dein nächster Schritt</p>
            <h2 className="text-xl font-bold text-foreground mt-1">{next.title}</h2>
            <p className="text-body text-muted mt-1 mb-4">{next.reason}</p>
            <Link href={next.href} className={linkButtonClassName({ size: "lg" })} data-testid="dashboard-next-step-cta">
              {next.cta} <ArrowRight size={16} className="ml-2" aria-hidden />
            </Link>
          </Card>

          <Card className="p-5 md:p-6">
            <CardTitle className="text-lg text-foreground mb-1">Deine Vorsorge</CardTitle>
            <AreaList states={states} />
            <p className="text-sm mt-3">
              <Link href={COMPLETION_PATH} className="text-primary underline" data-testid="dashboard-completion-link">
                Zusammenfassung ansehen
              </Link>
            </p>
          </Card>
        </div>

        <aside className="space-y-4 self-start">
          <Card className="p-5" data-testid="dashboard-package-card">
            <CardTitle className="flex items-center gap-2 text-base text-foreground">
              <Package size={18} aria-hidden /> Für deine Familie
            </CardTitle>
            <p className="text-sm text-muted mb-4">
              Stelle ein Notfallpaket zum Ausdrucken zusammen. Du entscheidest, was hineinkommt. Online wird nichts geteilt.
            </p>
            <Link href="/dashboard/notfallpaket" className={linkButtonClassName({ variant: "outline", className: "w-full" })}>
              Notfallpaket zusammenstellen
            </Link>
            <Link href="/dashboard/pdf" className="block text-sm text-primary underline mt-3 min-h-[44px]" data-testid="dashboard-documents-link">
              Dokumente &amp; Ausdrucke
            </Link>
          </Card>
          <p className="text-xs text-muted px-1">
            Diese Plattform ersetzt keinen Imam, Gelehrten, Arzt, Anwalt oder Notar. Keine Rechts- oder Fatwa-Beratung.
          </p>
        </aside>
      </div>

      <ModuleTiles />
    </div>
  );
}
