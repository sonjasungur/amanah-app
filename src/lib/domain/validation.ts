import { moduleConfigs } from "@/lib/modules/config";
import type { AmanahOrdnerData, InheritanceProfile, ModuleId } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface ModuleProgress {
  moduleId: ModuleId;
  percent: number;
  missingRequired: string[];
  warnings: string[];
}

export function getNestedValue(obj: AmanahOrdnerData | Record<string, unknown>, path: string): unknown {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function isFieldFilled(value: unknown): boolean {
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

function getFieldsForModule(mod: (typeof moduleConfigs)[number], kind: "critical" | "required" | "warning"): string[] {
  if (kind === "critical") return mod.criticalFields;
  if (kind === "required") return mod.requiredFields ?? mod.criticalFields;
  return mod.warningFields ?? [];
}

export function getModuleProgress(data: AmanahOrdnerData, moduleId: ModuleId): ModuleProgress {
  const mod = moduleConfigs.find((m) => m.id === moduleId);
  if (!mod) {
    return { moduleId, percent: 0, missingRequired: [], warnings: [] };
  }

  const requiredFields = getFieldsForModule(mod, "required");
  const warningFields = getFieldsForModule(mod, "warning");

  const missingRequired: string[] = [];
  const warnings: string[] = [];

  let filled = 0;
  for (const field of requiredFields) {
    const value = getNestedValue(data, field);
    if (isFieldFilled(value)) {
      filled++;
    } else {
      missingRequired.push(field);
    }
  }

  for (const field of warningFields) {
    const value = getNestedValue(data, field);
    if (!isFieldFilled(value)) {
      warnings.push(field);
    }
  }

  const percent = requiredFields.length > 0 ? Math.round((filled / requiredFields.length) * 100) : 0;

  return { moduleId, percent, missingRequired, warnings };
}

export function getAllModuleProgress(data: AmanahOrdnerData): ModuleProgress[] {
  return moduleConfigs.map((mod) => getModuleProgress(data, mod.id));
}

export function calculateProgress(data: AmanahOrdnerData): number {
  const all = getAllModuleProgress(data);
  if (all.length === 0) return 0;
  const sum = all.reduce((acc, m) => acc + m.percent, 0);
  return Math.round(sum / all.length);
}

const CRITICAL_LABELS: Record<string, string> = {
  "emergencyCard.emergencyContact1.name": "Notfallkontakt",
  "emergencyCard.hasPatientenverfuegung": "Patientenverfügung-Status",
  "emergencyCard.hasVorsorgevollmacht": "Vorsorgevollmacht-Status",
  "janazahWishes.preferredFuneralDirector": "Gewünschter Bestatter",
  debtsAmanah: "Schulden & Amanah-Liste",
  "powerOfAttorney.authorizedPerson": "Bevollmächtigte Person",
};

export function getCriticalMissing(data: AmanahOrdnerData): string[] {
  const missing: string[] = [];

  if (!data.emergencyCard.emergencyContact1.name) missing.push(CRITICAL_LABELS["emergencyCard.emergencyContact1.name"]);
  if (data.emergencyCard.hasPatientenverfuegung === null) missing.push(CRITICAL_LABELS["emergencyCard.hasPatientenverfuegung"]);
  if (data.emergencyCard.hasVorsorgevollmacht === null) missing.push(CRITICAL_LABELS["emergencyCard.hasVorsorgevollmacht"]);
  if (!data.janazahWishes.preferredFuneralDirector) missing.push(CRITICAL_LABELS["janazahWishes.preferredFuneralDirector"]);
  if (data.debtsAmanah.length === 0) missing.push(CRITICAL_LABELS.debtsAmanah);
  if (!data.powerOfAttorney.authorizedPerson) missing.push(CRITICAL_LABELS["powerOfAttorney.authorizedPerson"]);

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

  const progress = getModuleProgress(data, mod.id);
  if (progress.percent < 100) {
    return { moduleId: mod.id, title: mod.title, path: mod.path };
  }

  const firstIncomplete = moduleConfigs.find((m) => getModuleProgress(data, m.id).percent < 100);

  if (firstIncomplete) {
    return { moduleId: firstIncomplete.id, title: firstIncomplete.title, path: firstIncomplete.path };
  }

  return { moduleId: "pdf", title: "PDF erstellen", path: "/dashboard/pdf" };
}

export function validateImportData(data: AmanahOrdnerData): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data.userProfile || typeof data.userProfile !== "object") {
    errors.push("userProfile fehlt oder ist ungültig");
  }
  if (!data.emergencyCard || typeof data.emergencyCard !== "object") {
    errors.push("emergencyCard fehlt oder ist ungültig");
  }
  if (!Array.isArray(data.debtsAmanah)) {
    errors.push("debtsAmanah muss ein Array sein");
  }
  if (!Array.isArray(data.digitalLegacy)) {
    errors.push("digitalLegacy muss ein Array sein");
  }

  if (getCriticalMissing(data).length > 0) {
    warnings.push("Import enthält kritische Lücken — bitte zur Orientierung ergänzen und fachlich prüfen lassen.");
  }

  return { valid: errors.length === 0, errors, warnings };
}

export type InheritanceTrafficLight = "green" | "yellow" | "red";

export interface InheritanceCheckResult {
  status: InheritanceTrafficLight;
  warnings: string[];
  recommendations: string[];
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
