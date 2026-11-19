"use client";

import { Suspense, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, ClipboardList, FileText, FolderOpen, Printer } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { useFieldCorrections, withDateDrafts } from "@/lib/store/field-corrections";
import { DOCUMENTS, type DocumentId } from "@/lib/documents/model";
import { DocumentPanel } from "@/components/documents/document-panel";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusGate } from "@/components/billing/plus-gate";
import { cn } from "@/lib/utils/cn";
import { DOCUMENT_CHECKLIST, DOCUMENT_STATUS_LABELS } from "@/lib/vorsorge/documents";
import { folderTasks, printoutStates } from "@/lib/vorsorge/folder-tasks";

const fmtDate = (iso: string | null | undefined) =>
  iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" }) : null;
const fmtDateTime = (iso: string | null | undefined) =>
  iso && !Number.isNaN(Date.parse(iso)) ? new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

/** Folder state, open tasks and the originals with their places: the folder before any printout. */
function FolderOverview({ data }: { data: ReturnType<typeof pickDataFields> }) {
  const tasks = folderTasks(data);
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? tasks : tasks.slice(0, 6);
  const reviewed = fmtDate(data.vorsorgeMeta?.reviewedAt);
  return (
    <div className="space-y-4">
      <Card className="p-4" data-testid="folder-status">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FolderOpen size={20} className="text-primary" aria-hidden /> Mein Vorsorgeordner
        </h2>
        <dl className="mt-2 grid gap-2 sm:grid-cols-3 text-sm">
          <div>
            <dt className="text-muted">Zuletzt gespeichert</dt>
            <dd className="font-semibold" data-testid="folder-last-saved">{fmtDateTime(data.lastSaved) ?? "Noch nicht gespeichert"}</dd>
          </div>
          <div>
            <dt className="text-muted">Zuletzt überprüft</dt>
            <dd className="font-semibold" data-testid="folder-reviewed">{reviewed ?? "Noch nie bestätigt"}</dd>
          </div>
          <div>
            <dt className="text-muted">Offene Punkte</dt>
            <dd className="font-semibold" data-testid="folder-task-count">{tasks.length === 0 ? "Keine" : tasks.length}</dd>
          </div>
        </dl>
        <Link href="/dashboard/vorsorge/abschluss" className="text-sm font-semibold text-primary hover:underline inline-flex items-center min-h-[44px]">
          Alles überprüfen und abschließen
        </Link>
      </Card>

      <Card className="p-4" data-testid="folder-tasks">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ClipboardList size={20} className="text-primary" aria-hidden /> Was noch offen ist
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted mt-2 flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald" aria-hidden /> Nach deinen Angaben ist nichts offen. Das sagt nichts über die rechtliche Gültigkeit.
          </p>
        ) : (
          <>
            <ul className="mt-2 divide-y divide-border">
              {visible.map((t) => (
                <li key={t.id} className="py-2 flex items-start justify-between gap-3" data-kind={t.kind}>
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-medium text-sm">
                      {(t.kind === "widerspruch" || t.kind === "aktualitaet") && <AlertCircle size={14} className="text-warning shrink-0" aria-hidden />}
                      {t.title}
                    </span>
                    {t.detail && <span className="block text-xs text-muted break-words">{t.detail}</span>}
                  </span>
                  <Link href={t.path} className="text-sm text-primary hover:underline shrink-0 min-h-[44px] inline-flex items-center">
                    Öffnen
                  </Link>
                </li>
              ))}
            </ul>
            {tasks.length > 6 && (
              <Button type="button" variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)} aria-expanded={showAll}>
                {showAll ? "Weniger anzeigen" : `Alle ${tasks.length} anzeigen`}
              </Button>
            )}
          </>
        )}
      </Card>

      <Card className="p-4" data-testid="folder-originals">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <FileText size={20} className="text-primary" aria-hidden /> Meine Unterlagen und wo sie liegen
        </h2>
        <p className="text-sm text-muted mt-1">
          Die Originale bleiben bei dir. Amanah hält nur fest, ob es sie gibt und wo sie liegen; Dateien werden nicht hochgeladen.
        </p>
        <ul className="mt-2 divide-y divide-border text-sm">
          {DOCUMENT_CHECKLIST.map((c) => {
            const entry = data.documents.find((d) => d.type === c.type);
            return (
              <li key={c.type} className="py-2 grid gap-0.5 sm:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] sm:gap-3">
                <span className="font-medium">{c.title}</span>
                <span className={cn("break-words", !entry?.status && "text-muted")}>
                  {entry?.status ? [DOCUMENT_STATUS_LABELS[entry.status], entry.location?.trim() || (entry.status === "vorhanden" ? "Ort noch nicht angegeben" : "")].filter(Boolean).join(" · ") : "Nicht angegeben"}
                </span>
              </li>
            );
          })}
        </ul>
        <Link href="/dashboard/dokumente" className="text-sm font-semibold text-primary hover:underline inline-flex items-center min-h-[44px]">
          Unterlagen und Orte bearbeiten
        </Link>
      </Card>
    </div>
  );
}

/** Test ids kept from the earlier export page. */
const CARD_TEST_ID: Record<DocumentId, string> = {
  notfallkarte: "export-notfallkarte",
  notfallinfo: "export-notfallinfo",
  leitfaden: "export-leitfaden",
  gesamt: "export-full",
  janazah: "export-janazah",
  erbprofil: "export-testament",
  familienbrief: "export-familienbrief",
  schulden: "export-schulden",
  vermoegen: "export-vermoegen",
};

/** "Bereit" only when there is content, nothing required is missing and nothing contradicts. */
function StatusChip({ ready, missing, warnings = 0 }: { ready: boolean; missing: number; warnings?: number }) {
  const label = !ready ? "Noch keine Angaben" : warnings > 0 ? "Bitte prüfen" : missing > 0 ? "Unvollständig" : "Bereit";
  return (
    <span
      className={cn(
        "text-xs font-semibold rounded-full px-2.5 py-1 shrink-0",
        !ready ? "bg-border/60 text-muted" : missing > 0 || warnings > 0 ? "bg-warning/15 text-warning" : "bg-emerald/15 text-primary-dark",
      )}
    >
      {label}
    </span>
  );
}

function DocumentsPage() {
  const store = useAmanahStore();
  const drafts = useFieldCorrections((s) => s.open);
  const data = withDateDrafts(pickDataFields(store), drafts);
  const printouts = printoutStates(data);
  // "?dokument=janazah" opens that preview, e.g. from the Janazah page.
  const requested = useSearchParams()?.get("dokument");
  const fromLink = requested && requested !== "vermoegen" && DOCUMENTS.some((d) => d.id === requested) ? (requested as DocumentId) : null;
  const [chosen, setChosen] = useState<DocumentId | null>(null);
  const previewRef = useRef<HTMLElement>(null);
  /** Shows the chosen document and brings its preview into view (it sits below the list). */
  const setSelected = (id: DocumentId) => {
    setChosen(id);
    window.history.replaceState(null, "", `/dashboard/pdf?dokument=${id}`);
    requestAnimationFrame(() => {
      previewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      previewRef.current?.focus({ preventScroll: true });
    });
  };
  const selected = chosen ?? fromLink ?? "notfallkarte";

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <header>
          <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <FileText size={26} aria-hidden /> Meine Dokumente
          </h1>
          <p className="text-muted max-w-2xl">
            Dein Vorsorgeordner auf einen Blick: was gespeichert ist, was noch offen ist und wo deine Unterlagen liegen. Ausdrucke
            entstehen jedes Mal neu aus deinen aktuellen Angaben und werden nicht gespeichert. Es wird nichts automatisch übertragen. Kein Dokument hier
            ist ein Testament, eine Vollmacht oder eine Patientenverfügung.
          </p>
        </header>

        <FolderOverview data={data} />

        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2 pt-2">
          <Printer size={20} className="text-primary" aria-hidden /> Ausdrucke
        </h2>

        <div className="grid gap-3 sm:grid-cols-2" role="list" aria-label="Dokumente">
          {DOCUMENTS.map((doc) => {
            const model = doc.build(data);
            const active = selected === doc.id;
            const card = (
              <Card
                key={doc.id}
                role="listitem"
                data-testid={CARD_TEST_ID[doc.id]}
                className={cn("p-4 flex flex-col gap-2", active && "border-2 border-emerald/50")}
              >
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base text-foreground mb-0">{doc.id === "gesamt" ? "Gesamtübersicht (Vorsorge-Übersicht)" : doc.title}</CardTitle>
                  <StatusChip ready={model.hasContent} missing={model.missing.length} warnings={model.warnings.length} />
                </div>
                {(() => {
                  const p = printouts.find((x) => x.id === doc.id)!;
                  const changed = fmtDate(p.updatedAt);
                  return (
                    <p className="text-xs text-muted" data-testid={`printout-meta-${doc.id}`}>
                      {changed ? `Angaben zuletzt geändert: ${changed}` : p.ready ? "Änderungsdatum nicht erfasst" : "Noch keine Angaben"}
                      {p.warnings > 0 && <span className="text-warning font-semibold"> · {p.warnings === 1 ? "1 Widerspruch" : `${p.warnings} Widersprüche`} prüfen</span>}
                    </p>
                  );
                })()}
                <p className="text-sm text-muted flex-1">
                  {doc.id === "gesamt" ? "Alle Angaben zum Nachschlagen. Kein Testament, keine Vollmacht, keine Patientenverfügung." : doc.description}
                  {doc.id === "vermoegen" && " Der Ausdruck liegt direkt bei der Vermögensübersicht und gehört nicht zu Vorsorge Plus."}
                </p>
                {doc.id === "vermoegen" ? (
                  <Link href="/dashboard/vermoegen" className="text-sm font-semibold text-primary hover:underline inline-flex items-center min-h-[44px]" data-testid="export-vermoegen-link">
                    Zur Vermögensübersicht
                  </Link>
                ) : doc.id === "gesamt" ? (
                  <PlusGate feature="pdf_exports">
                    <Button type="button" variant={active ? "secondary" : "outline"} size="sm" onClick={() => setSelected(doc.id)} aria-pressed={active}>
                      Vorschau ansehen
                    </Button>
                  </PlusGate>
                ) : (
                  <Button type="button" variant={active ? "secondary" : "outline"} size="sm" onClick={() => setSelected(doc.id)} aria-pressed={active}>
                    Vorschau ansehen
                  </Button>
                )}
              </Card>
            );
            return card;
          })}
        </div>
      </div>

      <section aria-label="Vorschau und Druck" className="space-y-3 scroll-mt-24 focus:outline-none" ref={previewRef} tabIndex={-1} data-testid="pdf-preview-section">
        <h2 className="no-print text-lg font-semibold text-foreground">{DOCUMENTS.find((d) => d.id === selected)?.title}</h2>
        {selected === "gesamt" ? (
          // The complete overview keeps its existing Plus hint (plan matrix: pdf_exports).
          <PlusGate feature="pdf_exports">
            <DocumentPanel key={selected} id={selected} />
          </PlusGate>
        ) : (
          <DocumentPanel key={selected} id={selected} />
        )}
      </section>
    </div>
  );
}

export default function PdfPage() {
  return (
    <Suspense fallback={null}>
      <DocumentsPage />
    </Suspense>
  );
}
