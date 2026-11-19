"use client";

import type { AssetEntry } from "@/lib/domain/types";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { buildVermoegen } from "@/lib/documents/model";
import { DocumentView } from "@/components/documents/document-view";
import { ASSET_TYPES, MORTGAGE, OWNERSHIP } from "@/lib/testament/asset-labels";

export const ASSET_PRINT_NOTICE =
  "Reine Bestandsaufnahme. Diese Übersicht ist kein Testament und regelt nicht, wer etwas erhält. Sie enthält keine Bewertung und keine rechtliche Prüfung; die Angaben können veraltet oder unvollständig sein.";

/** What exists and where the papers are. Amounts and free notes are deliberately left out. */
export function AssetPrintEntries({ assets }: { assets: AssetEntry[] }) {
  if (assets.length === 0) return <p className="text-sm">Keine Einträge</p>;
  return (
    <ul className="text-sm">
      {assets.map((a) => (
        <li key={a.id} className="print-avoid-break mb-3 border-b border-primary/10 pb-2">
          <p className="font-medium break-words">{ASSET_TYPES[a.type]}: {a.description}</p>
          {a.locationHint && <p className="break-words">Unterlagen: {a.locationHint}</p>}
          {a.mortgage && <p>Hypothek oder Kredit: {MORTGAGE[a.mortgage]}</p>}
          {a.ownership && <p>Eigentum: {OWNERSHIP[a.ownership]}</p>}
        </li>
      ))}
    </ul>
  );
}

export function AssetPrintView() {
  const store = useAmanahStore();
  const data = pickDataFields(store);
  return <DocumentView model={buildVermoegen(data)} createdAt={new Date()} dataAsOf={data.lastSaved} testId="asset-print-view" />;
}
