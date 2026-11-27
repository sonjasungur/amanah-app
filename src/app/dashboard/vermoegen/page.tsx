"use client";

import { AssetOverview } from "@/components/testament/asset-overview";
import { AssetPrintView } from "@/components/print/asset-print-view";
import { SaveBar } from "@/components/storage/save-bar";

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
        </div>
        <AssetOverview />
        <SaveBar />
      </div>
      {/* The page prints only this document (see globals.css), so no blank first page appears. */}
      <div className="print-only doc-print-root" data-print-always="">
        <AssetPrintView />
      </div>
    </>
  );
}
