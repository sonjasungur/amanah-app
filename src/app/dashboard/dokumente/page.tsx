"use client";

import { Disclaimer } from "@/components/ui/disclaimer";
import { DocumentChecklist } from "@/components/vorsorge/document-checklist";
import { HelpTip } from "@/components/ui/help-tip";

/** Where important documents are — the app never stores the documents themselves. */
export default function DokumentePage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-primary mb-2 flex flex-wrap items-center">Wichtige Dokumente <HelpTip topic="dokumente-ablage" /></h1>
          <p className="text-muted max-w-2xl">
            Halte fest, ob ein Dokument vorhanden ist und wo das Original liegt. Amanah – Mein Wille speichert keine Dateien.
          </p>
        </div>
      </header>
      <DocumentChecklist />
      <Disclaimer />
    </div>
  );
}
