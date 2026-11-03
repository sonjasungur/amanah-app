"use client";

import { moduleText } from "@/lib/content/module-texts";
import { ModulePage } from "@/components/modules/module-page";
import { careDirectiveFields } from "@/lib/modules/fields";

export default function BetreuungPage() {
  return (
    <ModulePage
      title="Betreuungsverfügung"
      description={moduleText("betreuung-intro")}
      section="careDirective"
      fields={careDirectiveFields}
      disclaimerType="legal"
    />
  );
}
