"use client";

import { ModulePage } from "@/components/modules/module-page";
import { careDirectiveFields } from "@/lib/modules/fields";

export default function BetreuungPage() {
  return (
    <ModulePage
      title="Betreuungsverfügung"
      description="Bestimme, wer dich betreuen soll — und wer ausdrücklich nicht."
      section="careDirective"
      fields={careDirectiveFields}
      disclaimerType="legal"
    />
  );
}
