"use client";

import { ModulePage } from "@/components/modules/module-page";
import { medicalFields } from "@/lib/modules/fields";

export default function KrankheitPage() {
  return (
    <ModulePage
      title="Krankheit & Patientenverfügung"
      description="Dokumentiere medizinische und religiöse Wünsche für den Krankenhausfall."
      section="medicalWishes"
      fields={medicalFields}
      disclaimerType="legal"
    />
  );
}
