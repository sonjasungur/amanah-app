"use client";

import { AssetOverview } from "@/components/testament/asset-overview";
import { AssetPrintView } from "@/components/print/asset-print-view";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";

/** Free for good, including account storage and the simple printout (plan matrix: asset_overview). */
export default function VermoegenPage() {
  return (
    <>
      <div className="no-print max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-primary mb-2">Vermögensübersicht</h1>
            <p className="text-muted">Eine Bestandsaufnahme für dich und deine Familie. Sie regelt nicht, wer etwas erhält.</p>
          </div>
          <SaveStatusIndicator />
        </div>
        <AssetOverview />
      </div>
      <div className="print-only">
        <AssetPrintView />
      </div>
    </>
  );
}
