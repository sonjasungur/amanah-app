"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { getAllAreaStates } from "@/lib/vorsorge/areas";
import { DOCUMENT_STATUS_LABELS } from "@/lib/vorsorge/documents";
import { flowHref, firstStepOfArea } from "@/lib/vorsorge/flow";
import { AreaList } from "@/components/vorsorge/area-list";
import { Card, CardTitle } from "@/components/ui/card";
import { linkButtonClassName } from "@/components/ui/button";
import type { DocumentType } from "@/lib/domain/types";

/** Documents that only work in their own legal form. The app records whether they exist, never creates them. */
const LEGAL_DOCUMENTS: { type: DocumentType; title: string }[] = [
  { type: "patientenverfuegung", title: "Patientenverfügung" },
  { type: "vorsorgevollmacht", title: "Vorsorgevollmacht" },
  { type: "betreuungsverfuegung", title: "Betreuungsverfügung" },
  { type: "testament", title: "Testament" },
];

export default function AbschlussPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const states = getAllAreaStates(data);
  const complete = states.filter((s) => s.status === "vollstaendig");
  const toCheck = states.filter((s) => s.status === "pruefen");
  const open = states.filter((s) => s.status === "begonnen" || s.status === "nicht_begonnen");
  const allComplete = complete.length === states.length;

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="rounded-2xl bg-accent-soft border border-emerald/25 p-5 md:p-7" data-testid="completion-header">
        <h1 className="text-page-title font-bold text-foreground flex items-start gap-3">
          {allComplete && <CheckCircle2 size={30} className="text-emerald shrink-0 mt-1" aria-hidden />}
          {allComplete ? "Deine Angaben sind vollständig erfasst." : "Deine Zusammenfassung"}
        </h1>
        <p className="text-body text-muted mt-2 max-w-2xl">
          {allComplete
            ? "In allen sechs Bereichen stehen die wichtigsten Angaben. Das ordnet deine Vorsorge; rechtlich wirksam ist dadurch noch nichts."
            : `${complete.length} von ${states.length} Bereichen haben vollständige Angaben. Du kannst jederzeit weitermachen.`}
        </p>
      </header>

      <Card className="p-5 md:p-6">
        <CardTitle className="text-lg text-foreground">Deine Bereiche</CardTitle>
        <AreaList states={states} testId="completion-area-list" />
      </Card>

      {(toCheck.length > 0 || open.length > 0) && (
        <Card className="p-5 md:p-6" data-testid="completion-open">
          <CardTitle className="text-lg text-foreground">Das solltest du noch ansehen</CardTitle>
          <ul className="space-y-3 mt-2">
            {toCheck.map((s) => (
              <li key={s.area.id} className="text-sm">
                <span className="font-semibold">{s.area.title}:</span> {s.reviewReasons.join(" ")}{" "}
                <Link href={s.area.pages[0].path} className="text-primary underline">Prüfen</Link>
              </li>
            ))}
            {open.map((s) => (
              <li key={s.area.id} className="text-sm">
                <span className="font-semibold">{s.area.title}:</span>{" "}
                {s.status === "nicht_begonnen" ? "Noch nicht begonnen." : `Es fehlt: ${s.missing.join(", ")}.`}{" "}
                <Link href={flowHref(firstStepOfArea(s.area.id).id)} className="text-primary underline">Ergänzen</Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="p-5 md:p-6" data-testid="completion-legal">
        <CardTitle className="text-lg text-foreground">Rechtliche Dokumente brauchst du gesondert</CardTitle>
        <p className="text-sm text-muted mb-4 max-w-2xl">
          Deine Angaben hier sind persönliche Wünsche und Hinweise. Sie sind kein Testament, keine Vollmacht und keine
          Patientenverfügung. Ob du diese Dokumente brauchst und in welcher Form, klärst du mit Anwalt oder Notar. Hier
          siehst du, was du selbst dazu eingetragen hast.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {LEGAL_DOCUMENTS.map((doc) => {
            const status = data.documents.find((d) => d.type === doc.type)?.status;
            return (
              <li key={doc.type} className="rounded-xl border border-border p-3 text-sm flex justify-between gap-3">
                <span className="font-medium">{doc.title}</span>
                <span className="text-muted">{status ? DOCUMENT_STATUS_LABELS[status] : "Nicht angegeben"}</span>
              </li>
            );
          })}
        </ul>
        <p className="text-sm mt-3">
          <Link href="/dashboard/dokumente" className="text-primary underline">Dokumentenliste bearbeiten</Link>
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 md:p-6">
          <CardTitle className="text-lg text-foreground">Was du als Nächstes tun kannst</CardTitle>
          <ul className="text-sm text-muted space-y-2 list-disc pl-5">
            <li>Stelle ein Notfallpaket zusammen und gib es ausgedruckt deiner Vertrauensperson.</li>
            <li>Sag deiner Vertrauensperson, wo deine Originaldokumente liegen.</li>
            <li>Sprich offene Fragen mit Imam, Arzt, Anwalt oder Notar durch.</li>
          </ul>
          <Link href="/dashboard/notfallpaket" className={linkButtonClassName({ className: "mt-4 w-full sm:w-auto" })} data-testid="completion-package-cta">
            Notfallpaket zusammenstellen
          </Link>
        </Card>
        <Card className="p-5 md:p-6">
          <CardTitle className="text-lg text-foreground">Später etwas ändern</CardTitle>
          <p className="text-sm text-muted">
            Öffne einen Bereich oben und ändere deine Angaben. Sie werden automatisch gespeichert, und das Datum der letzten
            Änderung wird aktualisiert. Sieh nach Heirat, Geburt, Umzug, Trennung oder neuen Konten wieder hinein. Ein
            ausgedrucktes Notfallpaket aktualisiert sich nicht von selbst: Drucke es nach Änderungen neu.
          </p>
        </Card>
      </div>
    </div>
  );
}
