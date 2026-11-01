"use client";

import type { AssetEntry } from "@/lib/domain/types";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
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
  const assets = useAmanahStore((s) => s.assets);
  return (
    <div className="print-view max-w-2xl mx-auto p-8 bg-white" data-testid="asset-print-view">
      <div className="text-center mb-8 border-b-2 border-primary pb-4">
        <h1 className="text-2xl font-bold text-primary">Vermögensübersicht</h1>
        <p className="text-sm font-semibold">Kein Testament</p>
        <p className="text-sm text-muted">Stand: {new Date().toLocaleDateString("de-DE")}</p>
        <p className="text-xs text-muted mt-2">{ASSET_PRINT_NOTICE}</p>
      </div>
      <AssetPrintEntries assets={assets} />
      <p className="text-xs text-muted mt-6">Enthält private Angaben. Bewahre den Ausdruck sicher auf und gib ihn nur an Menschen, denen du vertraust.</p>
    </div>
  );
}
