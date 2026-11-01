"use client";

import { AssetOverview } from "@/components/testament/asset-overview";
import { AssetPrintView } from "@/components/print/asset-print-view";

/** Free for now, including the simple printout (plan matrix: asset_overview). */
export default function VermoegenPage() {
  return (
    <>
      <div className="no-print max-w-3xl">
        <h1 className="text-2xl font-bold text-primary mb-2">Vermögensübersicht</h1>
        <p className="text-muted">Eine Bestandsaufnahme für dich und deine Familie. Sie regelt nicht, wer etwas erhält.</p>
        <AssetOverview />
      </div>
      <div className="print-only">
        <AssetPrintView />
      </div>
    </>
  );
}
