"use client";

import { ModulePage } from "@/components/modules/module-page";
import { powerOfAttorneyFields } from "@/lib/modules/fields";

export default function VollmachtPage() {
  return (
    <ModulePage
      title="Vorsorgevollmacht"
      description="Lege fest, wer in deinem Namen entscheiden darf — medizinisch, behördlich und finanziell."
      section="powerOfAttorney"
      fields={powerOfAttorneyFields}
      disclaimerType="legal"
    />
  );
}
