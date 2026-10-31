import { isStagingBuild } from "@/lib/deployment-env";

/** Visible on every page of a staging build: testers must never enter real data. */
export function StagingBanner() {
  if (!isStagingBuild()) return null;
  return (
    <div className="bg-warning text-white text-center text-sm font-semibold px-4 py-2 no-print" role="note" data-testid="staging-banner">
      TESTUMGEBUNG – nur synthetische Testdaten eingeben. Keine echten Namen, Adressen oder Gesundheitsangaben.
    </div>
  );
}
