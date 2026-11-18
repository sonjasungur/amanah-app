"use client";

import Link from "next/link";
import { CheckCircle2, FileText, Lock, Users } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { formatAreaDate } from "@/lib/vorsorge/areas";
import { flowHref, firstStepOfArea } from "@/lib/vorsorge/flow";
import { HANDOVER_LABELS, handoverSummary } from "@/lib/vorsorge/handover";
import { AreaList } from "@/components/vorsorge/area-list";
import { Card, CardTitle } from "@/components/ui/card";
import { Button, linkButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * "Deine Vorsorge ist vorbereitet – was passiert jetzt?" What is done, what is open, what only
 * informs, what needs its own legal form, who should know, and when everything was last checked.
 * Nothing here says that the legal side is finished.
 */
export default function AbschlussPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const summary = handoverSummary(data);
  const states = summary.areas.map((a) => a.state);
  const toCheck = states.filter((s) => s.status === "pruefen");
  const open = states.filter((s) => s.status === "begonnen" || s.status === "nicht_begonnen");
  const complete = states.filter((s) => s.status === "vollstaendig").length;
  const reviewed = formatAreaDate(summary.reviewedAt);

  const markReviewed = () => {
    const meta = useAmanahStore.getState().vorsorgeMeta;
    store.updateField("vorsorgeMeta", { ...meta, reviewedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <header className="rounded-2xl bg-accent-soft border border-emerald/25 p-5 md:p-7" data-testid="completion-header">
        <h1 className="text-page-title font-bold text-foreground flex items-start gap-3">
          {summary.allComplete && <CheckCircle2 size={30} className="text-emerald shrink-0 mt-1" aria-hidden />}
          {summary.allComplete ? "Deine Vorsorge ist vorbereitet – was passiert jetzt?" : "Deine Zusammenfassung – was noch fehlt"}
        </h1>
        <p className="text-body text-muted mt-2 max-w-2xl">
          {summary.allComplete
            ? "Deine Angaben sind vollständig erfasst. Das ordnet deine Vorsorge; rechtlich wirksam ist dadurch noch nichts. Hier siehst du, was jetzt noch zu tun ist."
            : `${complete} von ${states.length} Bereichen haben vollständige Angaben. Du kannst jederzeit weitermachen.`}
        </p>
      </header>

      <Card className="p-5 md:p-6">
        <CardTitle className="text-lg text-foreground">Deine Bereiche</CardTitle>
        <AreaList states={states} testId="completion-area-list" />
        <ul className="mt-4 space-y-2 text-sm" data-testid="completion-handover">
          {summary.areas.map(({ state, statuses, expert }) => (
            <li key={state.area.id} className="flex flex-wrap items-center gap-2">
              <span className="font-medium">{state.area.title}:</span>
              {statuses.map((s) => (
                <span key={s} className={cn("rounded-full px-2 py-0.5 text-xs font-semibold", s === "fachpruefung_empfohlen" ? "bg-warning/15 text-warning" : "bg-accent-soft text-primary-dark")}>
                  {HANDOVER_LABELS[s]}
                </span>
              ))}
              {statuses.includes("fachpruefung_empfohlen") && expert && <span className="text-muted">Ansprechpartner: {expert}</span>}
            </li>
          ))}
        </ul>
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
          Patientenverfügung. Ob du diese Dokumente brauchst und in welcher Form, klärst du mit Fachleuten. Hier siehst du, was
          du selbst dazu eingetragen hast.
        </p>
        <ul className="grid gap-2 sm:grid-cols-2">
          {summary.legal.map((doc) => (
            <li key={doc.title} className="rounded-xl border border-border p-3 text-sm">
              <span className="flex justify-between gap-3">
                <span className="font-medium">{doc.title}</span>
                <span className={doc.status === "dokument_hinterlegt" ? "text-primary-dark font-semibold" : "text-muted"}>{doc.label}</span>
              </span>
              {doc.location && <span className="block text-muted mt-1">Aufbewahrt: {doc.location}</span>}
              <span className="block text-xs text-muted mt-1">Beratung: {doc.who}</span>
            </li>
          ))}
        </ul>
        <p className="text-sm mt-3">
          <Link href="/dashboard/dokumente" className="text-primary underline">Dokumentenliste bearbeiten</Link>
        </p>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 md:p-6" data-testid="completion-informative">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <FileText size={18} aria-hidden /> Nur zur Information
          </CardTitle>
          <p className="text-sm text-muted">
            Notfallkarte, Leitfaden für die Familie, Notfallpaket und Vorsorge-Übersicht ordnen deine Angaben für deine Familie.
            Sie haben keine rechtliche Wirkung.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Link href="/dashboard/pdf?dokument=leitfaden" className={linkButtonClassName({ size: "sm" })} data-testid="completion-guide-cta">
              Leitfaden für die Familie
            </Link>
            <Link href="/dashboard/notfallpaket" className={linkButtonClassName({ size: "sm", variant: "outline" })} data-testid="completion-package-cta">
              Notfallpaket zusammenstellen
            </Link>
          </div>
        </Card>
        <Card className="p-5 md:p-6" data-testid="completion-people">
          <CardTitle className="text-lg text-foreground flex items-center gap-2">
            <Users size={18} aria-hidden /> Wer Bescheid wissen sollte
          </CardTitle>
          {summary.people.length > 0 ? (
            <ul className="text-sm space-y-2">
              {summary.people.map((p) => (
                <li key={p.name}>
                  <span className="font-medium">{p.name}</span> <span className="text-muted">– {p.why}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">
              Noch niemand als Notfallkontakt oder Vertrauensperson markiert. <Link href="/dashboard/personen" className="text-primary underline">Familie &amp; Kontakte</Link>
            </p>
          )}
          <p className="text-xs text-muted mt-3">Amanah – Mein Wille benachrichtigt niemanden. Du entscheidest, wem du was gibst.</p>
        </Card>
      </div>

      <Card className="p-5 md:p-6" data-testid="completion-access">
        <CardTitle className="text-lg text-foreground flex items-center gap-2">
          <Lock size={18} aria-hidden /> Was deine Angehörigen im Notfall haben
        </CardTitle>
        <ul className="text-sm text-muted space-y-1 list-disc pl-5">
          <li>Was du ausgedruckt und übergeben hast: Notfallkarte, Leitfaden, Notfallpaket.</li>
          <li>Die Originale deiner rechtlichen Dokumente an den Orten, die du oben eingetragen hast.</li>
          <li>
            {HANDOVER_LABELS.freigegeben}: <span className="font-medium">noch nicht verfügbar</span>. Ein sicherer digitaler
            Zugang für benannte Personen wird geprüft; bis dahin teilt Amanah online nichts.
          </li>
        </ul>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5 md:p-6" data-testid="completion-reviewed">
          <CardTitle className="text-lg text-foreground">Zuletzt überprüft</CardTitle>
          <p className="text-sm text-muted">
            {reviewed ? `Du hast deine Angaben zuletzt am ${reviewed} als aktuell bestätigt.` : "Du hast deine Angaben noch nicht als überprüft bestätigt."}
          </p>
          <Button type="button" variant="outline" size="sm" className="mt-3" onClick={markReviewed} data-testid="completion-mark-reviewed">
            Ich habe alles überprüft – stimmt noch
          </Button>
        </Card>
        <Card className="p-5 md:p-6">
          <CardTitle className="text-lg text-foreground">Später etwas ändern</CardTitle>
          <p className="text-sm text-muted">
            Öffne einen Bereich oben und ändere deine Angaben. Sie werden automatisch gespeichert. Sieh nach Heirat, Geburt,
            Umzug, Trennung oder neuen Konten wieder hinein. Ausdrucke aktualisieren sich nicht von selbst: Drucke sie nach
            Änderungen neu.
          </p>
        </Card>
      </div>
    </div>
  );
}
