const SECTION_LABELS: Record<string, string> = {
  userProfile: "Profil",
  familyMembers: "Familie und Vertrauenspersonen",
  emergencyCard: "Notfallkarte",
  medicalWishes: "Medizinische Wünsche",
  powerOfAttorney: "Angaben zur Vollmacht",
  careDirective: "Wünsche zur Betreuung",
  janazahWishes: "Janazah-Wünsche",
  ghuslKafan: "Ghusl und Kafan",
  burialPreference: "Bestattung und Überführung",
  inheritanceProfile: "Erbprofil und Notizen",
  testamentPreparation: "Vorbereitung für das Gespräch",
  documents: "Dokumente",
  assets: "Vermögensübersicht",
  debtsAmanah: "Schulden und Amanah",
  digitalLegacy: "Digitaler Nachlass",
  donations: "Spendenwünsche",
  importantInstructions: "Wichtige Hinweise",
  barzakhPlan: "Barzakh",
  sadaqaJariya: "Sadaqa Jariya",
  familyMessage: "Familienbrief",
};

export function sectionLabel(section: string): string {
  return SECTION_LABELS[section] ?? "Weitere Angaben";
}

/** Plain text rows for display, rendered by React as text. Empty fields are left out. */
export function flattenForDisplay(value: unknown, path = ""): { path: string; text: string }[] {
  if (value === null || value === undefined || value === "") return [];
  if (Array.isArray(value)) return value.flatMap((item, i) => flattenForDisplay(item, path ? `${path} ${i + 1}` : `Eintrag ${i + 1}`));
  if (typeof value === "object") {
    return Object.entries(value).flatMap(([key, v]) => (key === "id" ? [] : flattenForDisplay(v, path ? `${path} / ${key}` : key)));
  }
  const text = typeof value === "boolean" ? (value ? "Ja" : "Nein") : String(value);
  return [{ path: path || "Wert", text }];
}
