"use client";

import { moduleText } from "@/lib/content/module-texts";
import { ModulePage } from "@/components/modules/module-page";
import { powerOfAttorneyFields } from "@/lib/modules/fields";

export default function VollmachtPage() {
  return (
    <ModulePage
      title="Vorsorgevollmacht"
      description={moduleText("vollmacht-intro")}
      section="powerOfAttorney"
      fields={powerOfAttorneyFields}
      disclaimerType="legal"
    />
  );
}
