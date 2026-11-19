"use client";

import Link from "next/link";
import { CalendarClock, CheckCircle2, FileText, Lock, MessageSquare, Scale, ShieldCheck, Users } from "lucide-react";
import type { ReactNode } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { REVIEW_AFTER_DAYS, formatAreaDate } from "@/lib/vorsorge/areas";
import { flowHref, firstStepOfArea } from "@/lib/vorsorge/flow";
import { HANDOVER_LABELS, handoverSummary } from "@/lib/vorsorge/handover";
import { familyReadiness } from "@/lib/vorsorge/family-readiness";
import { folderTasks, printoutStates } from "@/lib/vorsorge/folder-tasks";
import { DOCUMENT_CHECKLIST } from "@/lib/vorsorge/documents";
import { AreaList } from "@/components/vorsorge/area-list";
import { Card, CardTitle } from "@/components/ui/card";
import { Button, linkButtonClassName } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function Step({ n, title, icon, done, children, testId }: { n: number; title: string; icon: ReactNode; done?: boolean; children: ReactNode; testId: string }) {
  return (
    <section className="relative md:pl-14" aria-labelledby={`${testId}-title`} data-testid={testId}>
      <span
        className={cn(
          "hidden md:flex absolute left-0 top-1 h-10 w-10 items-center justify-center rounded-full text-base font-bold",
          done ? "bg-emerald text-white" : "bg-accent-soft text-primary-dark border border-emerald/30",
        )}
        aria-hidden
      >
        {done ? <CheckCircle2 size={20} /> : n}
      </span>
      <h2 id={`${testId}-title`} className="text-xl font-bold text-foreground flex items-center gap-2 mb-3">
        <span className="md:hidden text-primary">{n}.</span>
        {icon}
        {title}
        {done && <span className="sr-only">(nach deinen Angaben erledigt)</span>}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

const DAY_MS = 24 * 60 * 60 * 1000;
const EXPLAINED_LABEL = { ja: "Ja", teilweise: "Teilweise", nein: "Noch nicht", unbekannt: "Nicht angegeben" } as const;

/**
 * Completion in five steps: check, clarify the legal documents, prepare the relatives, keep things
 * safe, keep them up to date. Every step names what is open and where to do it. Nothing here says
 * that the legal side is finished, and no checkbox grants access or a power of attorney.
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
  const family = familyReadiness(data);
  const legalDone = summary.legal.filter((l) => l.status === "dokument_hinterlegt").length;
  const outdated = folderTasks(data).filter((t) => t.kind === "aktualitaet");
  const hasPrintouts = printoutStates(data).some((p) => p.ready);
  const nextReview = summary.reviewedAt ? formatAreaDate(new Date(Date.parse(summary.reviewedAt) + REVIEW_AFTER_DAYS * DAY_MS).toISOString()) : null;
  const knownDocs = DOCUMENT_CHECKLIST.filter((d) => family.documentsKnown.includes(d.type)).map((d) => d.title);

  const markReviewed = () => {
    const meta = useAmanahStore.getState().vorsorgeMeta;
    store.updateField("vorsorgeMeta", { ...meta, reviewedAt: new Date().toISOString() });
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <header className="rounded-2xl bg-accent-soft border border-emerald/25 p-5 md:p-7" data-testid="completion-header">
        <h1 className="text-page-title font-bold text-foreground flex items-start gap-3">
          {summary.allComplete && <CheckCircle2 size={30} className="text-emerald shrink-0 mt-1" aria-hidden />}
          {summary.allComplete ? "Deine Vorsorge ist vorbereitet – was passiert jetzt?" : "Deine Zusammenfassung – was noch fehlt"}
        </h1>
        <p className="text-body text-muted mt-2 max-w-2xl">
          {summary.allComplete
            ? "Deine Angaben sind vollständig erfasst. Das ordnet deine Vorsorge; rechtlich wirksam ist dadurch noch nichts. Die fünf Schritte unten zeigen, was jetzt noch zu tun ist."
            : `${complete} von ${states.length} Bereichen haben vollständige Angaben. Die fünf Schritte unten zeigen, was noch fehlt.`}
        </p>
        <ol className="mt-4 grid gap-1 text-sm sm:grid-cols-5" aria-label="Die fünf Schritte" data-testid="completion-steps">
          {["Überprüfen", "Rechtliches klären", "Angehörige vorbereiten", "Sicher hinterlegen", "Aktuell halten"].map((t, i) => (
            <li key={t} className="flex items-center gap-2 sm:flex-col sm:items-start">
              <span className="font-bold text-primary">{i + 1}</span> {t}
            </li>
          ))}
        </ol>
      </header>

      <Step n={1} title="Vorsorge überprüfen" icon={<ShieldCheck size={20} className="text-primary" aria-hidden />} done={toCheck.length === 0 && open.length === 0} testId="completion-step-1">
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
      </Step>

      <Step n={2} title="Dokumente und rechtliche Fragen klären" icon={<Scale size={20} className="text-primary" aria-hidden />} done={legalDone === summary.legal.length} testId="completion-step-2">
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
          <p className="text-sm mt-3 flex flex-wrap gap-x-4">
            <Link href="/dashboard/dokumente" className="text-primary underline min-h-[44px] inline-flex items-center">Dokumentenliste bearbeiten</Link>
            <Link href="/dashboard/pdf?dokument=erbprofil" className="text-primary underline min-h-[44px] inline-flex items-center">Fragen für das Gespräch mit Fachleuten</Link>
          </p>
        </Card>
      </Step>

      <Step n={3} title="Angehörige vorbereiten" icon={<Users size={20} className="text-primary" aria-hidden />} done={family.talks > 0 && family.notYetTalkedTo.length === 0 && family.openTasks.length === 0} testId="completion-step-3">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 md:p-6" data-testid="completion-people">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Users size={18} aria-hidden /> Wer Bescheid wissen sollte
            </CardTitle>
            {summary.people.length > 0 ? (
              <ul className="text-sm space-y-2">
                {summary.people.map((p) => (
                  <li key={p.name}>
                    <span className="font-medium">{p.name}</span> <span className="text-muted">– {p.why}</span>
                    {family.notYetTalkedTo.includes(p.name) && <span className="block text-xs text-warning">Noch kein Gespräch festgehalten.</span>}
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
          <Card className="p-5 md:p-6" data-testid="completion-family-talks">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <MessageSquare size={18} aria-hidden /> Eure Gespräche
            </CardTitle>
            {family.talks === 0 ? (
              <p className="text-sm text-muted">
                Noch kein Gespräch festgehalten. Sprich mit den Menschen links darüber, wo die Unterlagen liegen, was deine Wünsche
                sind und wer was übernimmt.
              </p>
            ) : (
              <dl className="text-sm space-y-1.5">
                <div>
                  <dt className="inline font-medium">Gespräche: </dt>
                  <dd className="inline">{family.talks}{family.lastTalk ? `, zuletzt am ${formatAreaDate(family.lastTalk)}` : ""}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Dabei waren: </dt>
                  <dd className="inline">{family.informed.join(", ") || "nicht angegeben"}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Aufbewahrungsort erklärt: </dt>
                  <dd className="inline">{EXPLAINED_LABEL[family.storageExplained]}</dd>
                </div>
                <div>
                  <dt className="inline font-medium">Unterlagen, die sie kennen sollen: </dt>
                  <dd className="inline">{knownDocs.join(", ") || "keine angegeben"}</dd>
                </div>
                {family.openTasks.length > 0 && (
                  <div>
                    <dt className="font-medium">Offene Aufgaben:</dt>
                    <dd>
                      <ul className="list-disc pl-5">
                        {family.openTasks.map((t, i) => (
                          <li key={i}>{[t.who, t.what].filter(Boolean).join(": ")}</li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
                {family.openPoints.length > 0 && (
                  <div>
                    <dt className="inline font-medium">Noch offen: </dt>
                    <dd className="inline">{family.openPoints.join(" · ")}</dd>
                  </div>
                )}
              </dl>
            )}
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/dashboard/familiengespraech" className={linkButtonClassName({ size: "sm" })} data-testid="completion-talk-cta">
                Mit Angehörigen besprechen
              </Link>
              <Link href="/dashboard/pdf?dokument=leitfaden" className={linkButtonClassName({ size: "sm", variant: "outline" })} data-testid="completion-guide-cta">
                Leitfaden für die Familie
              </Link>
            </div>
            <p className="text-xs text-muted mt-3">Ein festgehaltenes Gespräch gibt niemandem Zugriff oder eine Vollmacht.</p>
          </Card>
        </div>
      </Step>

      <Step n={4} title="Sicher hinterlegen" icon={<Lock size={20} className="text-primary" aria-hidden />} testId="completion-step-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 md:p-6" data-testid="completion-informative">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <FileText size={18} aria-hidden /> Nur zur Information
            </CardTitle>
            <p className="text-sm text-muted">
              Notfallkarte, Leitfaden für die Familie, Notfallpaket und Vorsorge-Übersicht ordnen deine Angaben für deine Familie.
              Sie haben keine rechtliche Wirkung.
            </p>
            <ul className="text-sm mt-3 space-y-1 list-disc pl-5">
              <li>Die Faltkarte der Notfallkarte gehört ins Portemonnaie, die zweite Karte zu einer Vertrauensperson.</li>
              <li>Notfallblatt und Leitfaden dorthin legen, wo die Familie zuerst sucht, und sagen, wo sie liegen.</li>
              <li>Die Originale bleiben, wo du sie eingetragen hast. Amanah lädt keine Dateien hoch.</li>
            </ul>
            <div className="flex flex-wrap gap-2 mt-4">
              <Link href="/dashboard/pdf?dokument=notfallkarte" className={linkButtonClassName({ size: "sm" })} data-testid="completion-card-cta">
                Notfallkarte drucken
              </Link>
              <Link href="/dashboard/notfallpaket" className={linkButtonClassName({ size: "sm", variant: "outline" })} data-testid="completion-package-cta">
                Notfallpaket zusammenstellen
              </Link>
            </div>
          </Card>
          <Card className="p-5 md:p-6" data-testid="completion-access">
            <CardTitle className="text-lg text-foreground flex items-center gap-2">
              <Lock size={18} aria-hidden /> Was deine Angehörigen im Notfall haben
            </CardTitle>
            <ul className="text-sm text-muted space-y-1 list-disc pl-5">
              <li>Was du ausgedruckt und übergeben hast: Notfallkarte, Leitfaden, Notfallpaket.</li>
              <li>Die Originale deiner rechtlichen Dokumente an den Orten, die du in Schritt 2 eingetragen hast.</li>
              <li>
                {HANDOVER_LABELS.freigegeben}: <span className="font-medium">noch nicht verfügbar</span>. Ein sicherer digitaler
                Zugang für benannte Personen wird geprüft; bis dahin teilt Amanah online nichts.
              </li>
            </ul>
          </Card>
        </div>
      </Step>

      <Step n={5} title="Vorsorge aktuell halten" icon={<CalendarClock size={20} className="text-primary" aria-hidden />} done={Boolean(reviewed) && outdated.length === 0} testId="completion-step-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-5 md:p-6" data-testid="completion-reviewed">
            <CardTitle className="text-lg text-foreground">Zuletzt überprüft</CardTitle>
            <p className="text-sm text-muted">
              {reviewed ? `Du hast deine Angaben zuletzt am ${reviewed} als aktuell bestätigt.` : "Du hast deine Angaben noch nicht als überprüft bestätigt."}
            </p>
            {nextReview && (
              <p className="text-sm mt-2" data-testid="completion-next-review">
                Nächste Durchsicht empfohlen bis <span className="font-semibold">{nextReview}</span>. Trage dir den Termin selbst ein;
                Amanah verschickt keine Erinnerungen.
              </p>
            )}
            <Button type="button" variant="outline" size="sm" className="mt-3" onClick={markReviewed} data-testid="completion-mark-reviewed">
              Ich habe alles überprüft – stimmt noch
            </Button>
          </Card>
          <Card className="p-5 md:p-6" data-testid="completion-outdated">
            <CardTitle className="text-lg text-foreground">Später etwas ändern</CardTitle>
            {outdated.length > 0 && (
              <ul className="text-sm mb-3 space-y-1">
                {outdated.map((t) => (
                  <li key={t.id}>
                    <Link href={t.path} className="text-warning font-semibold underline">
                      {t.title}
                    </Link>
                    : {t.detail}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-sm text-muted">
              Öffne einen Bereich und ändere deine Angaben; sie werden automatisch gespeichert. Sieh nach Heirat, Geburt, Umzug,
              Trennung, Krankheit oder neuen Konten wieder hinein. Ausdrucke aktualisieren sich nicht von selbst: Drucke sie nach
              Änderungen neu.
            </p>
            {hasPrintouts && (
              <p className="text-xs text-muted mt-2">
                Stand deiner Ausdrucke prüfen: <Link href="/dashboard/pdf" className="text-primary underline">Meine Dokumente</Link>
              </p>
            )}
          </Card>
        </div>
      </Step>
    </div>
  );
}
