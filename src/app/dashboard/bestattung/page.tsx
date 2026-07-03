"use client";

import { ModulePage } from "@/components/modules/module-page";
import { burialFields } from "@/lib/modules/fields";

export default function BestattungPage() {
  return (
    <ModulePage
      title="Bestattung / Überführung"
      description="Lege Kriterien fest: Beisetzung in Deutschland oder Überführung in die Heimat."
      section="burialPreference"
      fields={burialFields}
    />
  );
}
