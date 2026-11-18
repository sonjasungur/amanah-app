"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { FileText } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { DOCUMENTS, type DocumentId } from "@/lib/documents/model";
import { DocumentPanel } from "@/components/documents/document-panel";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusGate } from "@/components/billing/plus-gate";
import { cn } from "@/lib/utils/cn";

/** Test ids kept from the earlier export page. */
const CARD_TEST_ID: Record<DocumentId, string> = {
  notfallkarte: "export-notfallkarte",
  notfallinfo: "export-notfallinfo",
  gesamt: "export-full",
  janazah: "export-janazah",
  erbprofil: "export-testament",
  familienbrief: "export-familienbrief",
  schulden: "export-schulden",
  vermoegen: "export-vermoegen",
};

function StatusChip({ ready, missing }: { ready: boolean; missing: number }) {
  const label = !ready ? "Noch keine Angaben" : missing > 0 ? "Unvollständig" : "Bereit";
  return (
    <span
      className={cn(
        "text-xs font-semibold rounded-full px-2.5 py-1 shrink-0",
        !ready ? "bg-border/60 text-muted" : missing > 0 ? "bg-warning/15 text-warning" : "bg-emerald/15 text-primary-dark",
      )}
    >
      {label}
    </span>
  );
}

function DocumentsPage() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  // "?dokument=janazah" opens that preview, e.g. from the Janazah page.
  const requested = useSearchParams()?.get("dokument");
  const fromLink = requested && requested !== "vermoegen" && DOCUMENTS.some((d) => d.id === requested) ? (requested as DocumentId) : null;
  const [chosen, setSelected] = useState<DocumentId | null>(null);
  const selected = chosen ?? fromLink ?? "notfallkarte";

  return (
    <div className="space-y-6">
      <div className="no-print space-y-4">
        <header>
          <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
            <FileText size={26} aria-hidden /> Dokumente &amp; Ausdrucke
          </h1>
          <p className="text-muted max-w-2xl">
            Wähle ein Dokument, sieh dir die Vorschau an und drucke es oder speichere es als PDF. Es wird nichts automatisch
            übertragen. Kein Dokument hier ist ein Testament, eine Vollmacht oder eine Patientenverfügung.
          </p>
        </header>

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
                  <StatusChip ready={model.hasContent} missing={model.missing.length} />
                </div>
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

      <section aria-label="Vorschau und Druck" className="space-y-3">
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
