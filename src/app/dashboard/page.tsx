"use client";

import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { moduleConfigs } from "@/lib/modules/config";
import { getCriticalMissing, getRecommendedNextStep } from "@/lib/utils/progress";
import { ProgressBar } from "@/components/dashboard/progress-bar";
import { StorageControls } from "@/components/storage/storage-controls";
import { PathSelector } from "@/components/onboarding/path-selector";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowRight, Bot, FileText, Heart } from "lucide-react";

export default function DashboardPage() {
  const store = useAmanahStore();
  const critical = getCriticalMissing(store);
  const nextStep = getRecommendedNextStep(store);
  const greeting = store.emergencyCard.name || store.userProfile.name || "dort";

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-card to-accent/5 border border-primary/10 p-6 md:p-8">
        <p className="text-accent font-medium text-sm mb-1">Assalamu alaikum</p>
        <h1 className="text-2xl md:text-3xl font-bold text-primary mb-2">
          Willkommen, {greeting}
        </h1>
        <p className="text-muted mb-6">
          Dein AmanahOrdner hilft dir, Wünsche und Pflichten geordnet vorzubereiten — für dich und deine Familie.
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
      </div>

      {critical.length > 0 && (
        <Card className="border-warning/40 bg-warning/5">
          <CardTitle className="flex items-center gap-2 text-warning">
            <AlertTriangle size={20} /> Kritische offene Punkte
          </CardTitle>
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
        <CardTitle>Empfohlener nächster Schritt</CardTitle>
        <p className="text-muted text-sm mb-4">
          Basierend auf deinem gewählten Weg und deinem Fortschritt.
        </p>
        <Link href={nextStep.path}>
          <Button>
            {nextStep.title} <ArrowRight size={16} className="ml-2" />
          </Button>
        </Link>
      </Card>

      <section>
        <h2 className="text-xl font-bold text-primary mb-4">Alle Module</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {moduleConfigs.map((mod) => (
            <Link key={mod.id} href={mod.path}>
              <Card className="h-full hover:border-primary/30 hover:shadow-md transition-all group">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{mod.icon}</span>
                  <div>
                    <h3 className="font-semibold text-primary group-hover:text-primary-light transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted mt-1">{mod.description}</p>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
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
