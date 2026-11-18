"use client";

import { useState } from "react";
import Link from "next/link";
import { Eye, FileDown, Printer, ShieldAlert } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { DOCUMENTS, documentFileTitle, type DocumentId } from "@/lib/documents/model";
import { DocumentView, WalletCard, variantFor, type DocVariant } from "@/components/documents/document-view";
import { Button } from "@/components/ui/button";

/**
 * Preview and print of one document, right where the details are entered. Prints only the document
 * (never the form). Health details join only after an explicit choice for this printout. An empty
 * document is not offered for printing; the panel says what is missing instead.
 */
export function DocumentPanel({ id, variant: chosenVariant, previewOpen = true }: { id: DocumentId; variant?: DocVariant; previewOpen?: boolean }) {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  const info = DOCUMENTS.find((d) => d.id === id)!;
  const [includeHealth, setIncludeHealth] = useState(false);
  const [askHealth, setAskHealth] = useState(false);
  const [showPreview, setShowPreview] = useState(previewOpen);
  const model = info.build(data, { includeHealth });
  const variant = chosenVariant ?? variantFor(id);
  const createdAt = new Date();

  const print = () => {
    const title = document.title;
    document.title = documentFileTitle(model, createdAt);
    // Only the document goes on paper: forms, menus and notices around it are left out (see globals.css).
    document.body.dataset.printDoc = id;
    const done = () => {
      delete document.body.dataset.printDoc;
      window.removeEventListener("afterprint", done);
    };
    window.addEventListener("afterprint", done);
    window.print();
    document.title = title;
    done();
  };

  return (
    <div className="space-y-4" data-testid={`document-panel-${id}`}>
      <div className="no-print space-y-3">
        {info.health && (
          <div className="rounded-xl border border-border p-3 text-sm">
            <label className="flex items-start gap-3 min-h-[44px]">
              <input
                type="checkbox"
                className="mt-1 h-5 w-5"
                checked={includeHealth}
                onChange={(e) => (e.target.checked ? setAskHealth(true) : setIncludeHealth(false))}
                data-testid="doc-include-health"
              />
              <span>Gesundheitsangaben in den Ausdruck aufnehmen</span>
            </label>
            {askHealth && (
              <div className="mt-2 rounded-lg border border-warning/40 bg-warning/5 p-3" role="group" aria-label="Gesundheitsangaben bestätigen" data-testid="doc-health-confirm">
                <p className="flex gap-2">
                  <ShieldAlert size={16} className="text-warning shrink-0 mt-0.5" aria-hidden />
                  Gesundheitsangaben sind besonders sensibel. Nimm sie nur auf, wenn alle, die dieses Blatt sehen, sie kennen sollen.
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setIncludeHealth(true); setAskHealth(false); }} data-testid="doc-health-yes">
                    Aufnehmen
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setAskHealth(false)}>
                    Nicht aufnehmen
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {model.hasContent ? (
          <div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => setShowPreview((v) => !v)} aria-expanded={showPreview} data-testid="doc-preview-toggle">
                <Eye size={16} className="mr-2" aria-hidden /> {showPreview ? "Vorschau ausblenden" : "Vorschau anzeigen"}
              </Button>
              <Button type="button" variant="secondary" onClick={print} data-testid="doc-pdf">
                <FileDown size={16} className="mr-2" aria-hidden /> Als PDF speichern
              </Button>
              <Button type="button" variant="secondary" onClick={print} data-testid="doc-print">
                <Printer size={16} className="mr-2" aria-hidden /> Drucken
              </Button>
            </div>
            <p className="text-xs text-muted mt-1">
              „Als PDF speichern“ öffnet den Druckdialog: dort „Als PDF speichern“ als Ziel wählen. Es wird nichts automatisch übertragen.
            </p>
            {(model.missing.length > 0 || model.warnings.length > 0) && (
              <div className="mt-3 rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm" data-testid="doc-gaps">
                {model.warnings.length > 0 && (
                  <>
                    <p className="font-semibold">Bitte prüfen</p>
                    <ul className="list-disc pl-5">
                      {model.warnings.map((w) => (
                        <li key={w}>{w}</li>
                      ))}
                    </ul>
                  </>
                )}
                {model.missing.length > 0 && <p className={model.warnings.length ? "mt-2" : ""}>Noch offen: {model.missing.join(" · ")}</p>}
                <Link href={model.editPath} className="text-primary font-semibold underline inline-flex items-center min-h-[44px]" data-testid="doc-gaps-link">
                  Angaben ergänzen
                </Link>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-4 text-sm" data-testid="doc-empty">
            <p className="font-semibold">Für dieses Dokument gibt es noch keine Angaben.</p>
            <p className="text-muted mt-1">Ein leeres Blatt hilft deiner Familie nicht. Trage zuerst etwas ein, dann kannst du es drucken.</p>
            <Link href={model.editPath} className="text-primary underline inline-block mt-2 min-h-[44px]">
              Angaben ergänzen
            </Link>
          </div>
        )}

        {(showPreview || !model.hasContent) && (
        <>
        <p className="text-sm font-semibold text-foreground">Vorschau</p>
        <div className="rounded-2xl border border-border bg-white shadow-sm overflow-x-auto" data-testid="doc-preview">
          <DocumentView model={model} createdAt={createdAt} dataAsOf={data.lastSaved} variant={variant} testId={`doc-preview-${id}`} />
          {model.hasContent && <WalletCard model={model} variant={variant} />}
        </div>
        </>
        )}
      </div>
      {model.hasContent && (
        <div className="print-only doc-print-root">
          <DocumentView model={model} createdAt={createdAt} dataAsOf={data.lastSaved} variant={variant} testId={`doc-print-${id}`} />
          <WalletCard model={model} variant={variant} />
        </div>
      )}
    </div>
  );
}
