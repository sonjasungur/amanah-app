"use client";

import { ModulePage } from "@/components/modules/module-page";
import { sadaqaFields } from "@/lib/modules/fields";

export default function SadaqaJariyaPage() {
  return (
    <ModulePage
      title="Sadaqa Jariya"
      description="Das Gute, das nach dir bleibt — Waqf, Spenden und laufende Taten der Nächstenliebe."
      section="sadaqaJariya"
      fields={sadaqaFields}
      disclaimerType="islamic"
    />
  );
}
