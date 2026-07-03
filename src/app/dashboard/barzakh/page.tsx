"use client";

import { ModulePage } from "@/components/modules/module-page";
import { barzakhFields } from "@/lib/modules/fields";

export default function BarzakhPage() {
  return (
    <ModulePage
      title="Barzakh-Plan"
      description="Bereite vor, was deine Familie nach deinem Tod zuerst prüfen und erledigen soll."
      section="barzakhPlan"
      fields={barzakhFields}
      disclaimerType="islamic"
    />
  );
}
