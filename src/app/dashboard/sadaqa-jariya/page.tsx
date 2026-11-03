"use client";

import { moduleText } from "@/lib/content/module-texts";
import { ModulePage } from "@/components/modules/module-page";
import { sadaqaFields } from "@/lib/modules/fields";

export default function SadaqaJariyaPage() {
  return (
    <ModulePage
      title="Sadaqa Jariya"
      description={moduleText("sadaqa-intro")}
      section="sadaqaJariya"
      fields={sadaqaFields}
      disclaimerType="islamic"
    />
  );
}
