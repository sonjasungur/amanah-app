import type { AmanahOrdnerData, InheritanceProfile, InheritanceCheckResult, ModuleId } from "@/lib/types";
import { moduleConfigs } from "@/lib/modules/config";

export function calculateProgress(data: AmanahOrdnerData): number {
  const modules = moduleConfigs;
  let filled = 0;
  let total = 0;

  for (const mod of modules) {
    for (const field of mod.criticalFields) {
      total++;
      const value = getNestedValue(data, field);
      if (isFieldFilled(value)) filled++;
    }
  }

  return total > 0 ? Math.round((filled / total) * 100) : 0;
}

function getNestedValue(obj: AmanahOrdnerData | Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function isFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (typeof value === "boolean") return true;
  if (typeof value === "number") return true;
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if ("name" in obj) return Boolean((obj.name as string)?.trim());
    return Object.values(obj).some((v) => isFieldFilled(v));
  }
  return false;
}

export function getCriticalMissing(data: AmanahOrdnerData): string[] {
  const missing: string[] = [];

  if (!data.emergencyCard.emergencyContact1.name) missing.push("Notfallkontakt");
  if (data.emergencyCard.hasPatientenverfuegung === null) missing.push("Patientenverfügung-Status");
  if (data.emergencyCard.hasVorsorgevollmacht === null) missing.push("Vorsorgevollmacht-Status");
  if (!data.janazahWishes.preferredFuneralDirector) missing.push("Gewünschter Bestatter");
  if (data.debtsAmanah.length === 0) missing.push("Schulden & Amanah-Liste");
  if (!data.powerOfAttorney.authorizedPerson) missing.push("Bevollmächtigte Person");

  return missing;
}

export function getRecommendedNextStep(data: AmanahOrdnerData): { moduleId: ModuleId | "pdf"; title: string; path: string } {
  const pathMap: Record<string, ModuleId> = {
    krankheit: "krankheit",
    janazah: "janazah",
    testament: "testament",
    "schulden-amanah": "schulden-amanah",
    barzakh: "barzakh",
    familie: "familie",
    complete: "notfallkarte",
  };

  const selected = pathMap[data.selectedPath] || "notfallkarte";
  const mod = moduleConfigs.find((m) => m.id === selected) || moduleConfigs[0];

  const hasEmpty = mod.criticalFields.some((f) => !isFieldFilled(getNestedValue(data, f)));
  if (hasEmpty) {
    return { moduleId: mod.id, title: mod.title, path: mod.path };
  }

  const firstIncomplete = moduleConfigs.find((m) =>
    m.criticalFields.some((f) => !isFieldFilled(getNestedValue(data, f)))
  );

  if (firstIncomplete) {
    return { moduleId: firstIncomplete.id, title: firstIncomplete.title, path: firstIncomplete.path };
  }

  return { moduleId: "pdf", title: "PDF erstellen", path: "/dashboard/pdf" };
}

export function checkInheritance(profile: InheritanceProfile): InheritanceCheckResult {
  const warnings: string[] = [];
  const recommendations: string[] = [];
  let status: InheritanceCheckResult["status"] = "green";

  if (profile.desiredWasiyyah.toLowerCase().includes("alles") || profile.desiredWasiyyah.toLowerCase().includes("100%")) {
    warnings.push("Alles an eine Person zu vererben widerspricht den festen Erbanteilen (Farāʾiḍ).");
    status = "red";
  }

  if (profile.desiredWasiyyah.toLowerCase().includes("tochter") && profile.desiredWasiyyah.toLowerCase().includes("ausschlie")) {
    warnings.push("Töchter haben festgelegte Erbrechte — sie können nicht vollständig ausgeschlossen werden.");
    status = "red";
  }

  if (profile.desiredSadaqaJariya && parseFloat(profile.desiredSadaqaJariya.replace(/[^0-9.]/g, "")) > 33) {
    warnings.push("Sadaqa Jariya aus dem Nachlass ist auf maximal ein Drittel (Waṣiyya) begrenzt.");
    if (status !== "red") status = "yellow";
  }

  if (profile.stepchildren && !profile.desiredWasiyyah) {
    recommendations.push("Stiefkinder sind nicht automatisch Pflicht-Erben. Waṣiyya bis 1/3 kann hier helfen — mit Imam/Notar prüfen.");
    if (status === "green") status = "yellow";
  }

  if (profile.nonMuslimRelatives) {
    recommendations.push("Nicht-muslimische Angehörige: Erbschaftsregeln unterscheiden sich. Imam UND Anwalt konsultieren.");
    if (status === "green") status = "yellow";
  }

  if (profile.foreignProperty || profile.companyGmbH) {
    recommendations.push("Auslandseigentum oder GmbH-Anteile erfordern spezialisierte rechtliche Beratung.");
    if (status === "green") status = "yellow";
  }

  if (warnings.length === 0 && recommendations.length === 0) {
    recommendations.push("Grunddaten erfasst. Bitte Imam/Gelehrte und Anwalt/Notar für verbindliche Prüfung konsultieren.");
  }

  return { status, warnings, recommendations };
}
