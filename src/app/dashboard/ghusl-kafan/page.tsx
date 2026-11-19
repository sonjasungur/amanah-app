"use client";

import { ModulePage } from "@/components/modules/module-page";
import { JanazahModuleNav } from "@/components/modules/janazah-module-nav";
import { ghuslKafanFields } from "@/lib/modules/fields";

export default function GhuslKafanPage() {
  return (
    <>
      <JanazahModuleNav />
      <ModulePage
      help="ghusl"
        title="Ghusl & Kafan"
        description="Dokumentiere Wünsche zur Waschung und zum Leichentuch — mit Würde und Schamgrenzen."
        section="ghuslKafan"
        fields={ghuslKafanFields}
        disclaimerType="islamic"
      />
    </>
  );
}
