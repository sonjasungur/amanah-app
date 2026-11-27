import { defaultAmanahData } from "@/lib/domain/defaults";
import type { AmanahOrdnerData, DocumentType, VorsorgeAreaId } from "@/lib/domain/types";
import { DOCUMENT_CHECKLIST } from "@/lib/vorsorge/documents";

/**
 * The six areas of the guided Vorsorge. A status only says whether the person entered the core
 * details of an area. It never says anything about legal or religious validity.
 */
export type AreaStatus = "nicht_begonnen" | "begonnen" | "vollstaendig" | "pruefen";

export const AREA_STATUS_LABELS: Record<AreaStatus, string> = {
  nicht_begonnen: "Nicht begonnen",
  begonnen: "Begonnen",
  vollstaendig: "Angaben vollständig",
  pruefen: "Prüfen",
};

/** A year without a change is a good moment to look again (life events change a lot). */
export const REVIEW_AFTER_DAYS = 365;
const DAY_MS = 24 * 60 * 60 * 1000;

type DataSection = keyof AmanahOrdnerData;

export interface AreaCheck {
  label: string;
  done: (data: AmanahOrdnerData) => boolean;
}

export interface AreaPage {
  title: string;
  path: string;
}

export interface VorsorgeArea {
  id: VorsorgeAreaId;
  title: string;
  description: string;
  /** Folder sections whose changes count as a change in this area. */
  sections: DataSection[];
  pages: AreaPage[];
  /** What "Angaben vollständig" means here, shown to the person. */
  core: AreaCheck[];
  /** Helpful, but not needed for "Angaben vollständig". */
  optional: AreaCheck[];
}

const filled = (value: unknown) => typeof value === "string" && value.trim().length > 0;
const docStatus = (data: AmanahOrdnerData, type: DocumentType) => data.documents.find((d) => d.type === type)?.status;

export const VORSORGE_AREAS: readonly VorsorgeArea[] = [
  {
    id: "notfall",
    title: "Notfallkarte",
    description: "Wer angerufen wird und was Ärzte sofort wissen sollten.",
    sections: ["emergencyCard"],
    pages: [{ title: "Notfallkarte", path: "/dashboard/notfallkarte" }],
    core: [
      { label: "Dein Name", done: (d) => filled(d.emergencyCard.name) },
      {
        label: "Ein Notfallkontakt mit Telefonnummer",
        done: (d) => filled(d.emergencyCard.emergencyContact1.name) && filled(d.emergencyCard.emergencyContact1.phone),
      },
    ],
    optional: [
      { label: "Zweiter Notfallkontakt", done: (d) => filled(d.emergencyCard.emergencyContact2.name) },
      { label: "Hausarzt", done: (d) => filled(d.emergencyCard.familyDoctor) },
    ],
  },
  {
    id: "familie",
    title: "Familie & Kontakte",
    description: "Jede Person nur einmal, für Notfallkarte, Vollmacht und Janazah.",
    // The conversation record counts as a change in this area (date of last change), not as core detail.
    sections: ["familyMembers", "familyConversation"],
    pages: [{ title: "Familie & Kontakte", path: "/dashboard/personen" }],
    core: [
      { label: "Mindestens eine Person eingetragen", done: (d) => d.familyMembers.length > 0 },
      {
        label: "Eine Person als Notfallkontakt markiert",
        done: (d) => d.familyMembers.some((m) => m.roles?.includes("notfallkontakt")),
      },
    ],
    optional: [
      { label: "Eine Vertrauensperson markiert", done: (d) => d.familyMembers.some((m) => m.roles?.includes("vertrauensperson")) },
    ],
  },
  {
    id: "gesundheit",
    title: "Gesundheit & Vollmachten",
    description: "Wünsche bei Krankheit und wer für dich sprechen soll.",
    sections: ["medicalWishes", "powerOfAttorney", "careDirective"],
    pages: [
      { title: "Krankheit & Patientenverfügung", path: "/dashboard/krankheit" },
      { title: "Vorsorgevollmacht", path: "/dashboard/vollmacht" },
      { title: "Betreuungsverfügung", path: "/dashboard/betreuung" },
    ],
    core: [
      { label: "Deine Wünsche bei Krankheit", done: (d) => filled(d.medicalWishes.medicalWishes) || filled(d.medicalWishes.religiousWishes) },
      { label: "Person, die für dich handeln soll", done: (d) => filled(d.powerOfAttorney.authorizedPerson) },
      { label: "Ob es eine Patientenverfügung gibt", done: (d) => d.emergencyCard.hasPatientenverfuegung !== null },
      { label: "Ob es eine Vorsorgevollmacht gibt", done: (d) => d.emergencyCard.hasVorsorgevollmacht !== null },
    ],
    optional: [
      { label: "Ersatzperson", done: (d) => filled(d.powerOfAttorney.substitutePerson) },
      { label: "Gewünschter Betreuer", done: (d) => filled(d.careDirective.preferredGuardian) },
    ],
  },
  {
    id: "janazah",
    title: "Janazah & Bestattung",
    description: "Deine Wünsche für Waschung, Gebet und Beisetzung.",
    sections: ["janazahWishes", "ghuslKafan", "burialPreference"],
    pages: [
      { title: "Janazah-Wünsche", path: "/dashboard/janazah" },
      { title: "Ghusl & Kafan", path: "/dashboard/ghusl-kafan" },
      { title: "Bestattung / Überführung", path: "/dashboard/bestattung" },
    ],
    core: [
      { label: "Ob eine islamische Bestattung gewünscht ist", done: (d) => d.janazahWishes.islamicBurialDesired !== null },
      {
        label: "Bestatter oder Moschee",
        done: (d) => filled(d.janazahWishes.preferredFuneralDirector) || filled(d.janazahWishes.preferredMosque),
      },
      {
        label: "Ort der Beisetzung",
        done: (d) =>
          d.janazahWishes.burialGermany !== null || d.janazahWishes.repatriation !== "" || filled(d.burialPreference.cityPlz),
      },
    ],
    optional: [{ label: "Wünsche zu Ghusl und Kafan", done: (d) => filled(d.ghuslKafan.whoMayBePresent) }],
  },
  {
    id: "dokumente",
    title: "Dokumente",
    description: "Ob es ein Dokument gibt und wo das Original liegt.",
    sections: ["documents"],
    pages: [{ title: "Wichtige Dokumente", path: "/dashboard/dokumente" }],
    core: [
      {
        label: "Status für Patientenverfügung, Vorsorgevollmacht und Testament",
        done: (d) => (["patientenverfuegung", "vorsorgevollmacht", "testament"] as DocumentType[]).every((t) => docStatus(d, t)),
      },
      {
        label: "Ablageort für jedes vorhandene Dokument",
        done: (d) => {
          const present = d.documents.filter((doc) => doc.status === "vorhanden");
          return present.length > 0 && present.every((doc) => filled(doc.location));
        },
      },
    ],
    optional: [
      {
        label: "Status für alle Dokumente der Liste",
        done: (d) => DOCUMENT_CHECKLIST.every((c) => docStatus(d, c.type)),
      },
    ],
  },
  {
    id: "vermoegen",
    title: "Vermögen & Schulden",
    description: "Was es gibt, was offen ist und wo die Unterlagen liegen.",
    sections: ["assets", "debtsAmanah", "digitalLegacy"],
    pages: [
      { title: "Vermögensübersicht", path: "/dashboard/vermoegen" },
      { title: "Schulden & Amanah", path: "/dashboard/schulden-amanah" },
      { title: "Digitaler Nachlass", path: "/dashboard/digitaler-nachlass" },
    ],
    core: [
      { label: "Mindestens ein Vermögensposten", done: (d) => d.assets.length > 0 },
      { label: "Mindestens ein Hinweis zum digitalen Nachlass", done: (d) => d.digitalLegacy.length > 0 },
    ],
    optional: [{ label: "Schulden & Amanah, falls vorhanden", done: (d) => d.debtsAmanah.length > 0 }],
  },
];

const SECTION_TO_AREA = new Map<DataSection, VorsorgeAreaId>(
  VORSORGE_AREAS.flatMap((area) => area.sections.map((section) => [section, area.id] as const)),
);

export function areaForSection(section: DataSection): VorsorgeAreaId | null {
  return SECTION_TO_AREA.get(section) ?? null;
}

export function getArea(id: VorsorgeAreaId): VorsorgeArea {
  return VORSORGE_AREAS.find((a) => a.id === id) as VorsorgeArea;
}

/** True when the value holds something the person entered (defaults such as "Deutsch" do not count). */
export function hasUserContent(value: unknown, fallback: unknown): boolean {
  if (Array.isArray(value)) return value.length > 0;
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0 && value !== fallback;
  if (typeof value === "boolean" || typeof value === "number") return value !== fallback;
  if (typeof value === "object") {
    const defaults = (fallback && typeof fallback === "object" ? fallback : {}) as Record<string, unknown>;
    return Object.entries(value as Record<string, unknown>).some(([key, v]) => hasUserContent(v, defaults[key]));
  }
  return false;
}

export function isAreaStarted(data: AmanahOrdnerData, area: VorsorgeArea): boolean {
  return area.sections.some((section) => hasUserContent(data[section], defaultAmanahData[section]));
}

/** Reasons to look at an area again. Facts from the person's own entries, no judgement about content. */
export function getReviewReasons(data: AmanahOrdnerData, area: VorsorgeArea, now: Date = new Date()): string[] {
  const reasons: string[] = [];
  if (area.id === "dokumente") {
    const marked = data.documents.filter((d) => d.status === "pruefen").length;
    if (marked > 0) reasons.push(marked === 1 ? "1 Dokument ist als „prüfen“ markiert." : `${marked} Dokumente sind als „prüfen“ markiert.`);
    if (data.emergencyCard.hasPatientenverfuegung === true && docStatus(data, "patientenverfuegung") === "fehlt") {
      reasons.push("Patientenverfügung: Auf der Notfallkarte steht „vorhanden“, in der Dokumentenliste „fehlt noch“.");
    }
    if (data.emergencyCard.hasVorsorgevollmacht === true && docStatus(data, "vorsorgevollmacht") === "fehlt") {
      reasons.push("Vorsorgevollmacht: Auf der Notfallkarte steht „vorhanden“, in der Dokumentenliste „fehlt noch“.");
    }
  }
  const updatedAt = data.vorsorgeMeta?.areaUpdatedAt?.[area.id];
  if (updatedAt && isAreaStarted(data, area) && now.getTime() - Date.parse(updatedAt) > REVIEW_AFTER_DAYS * DAY_MS) {
    reasons.push("Seit über einem Jahr nicht geändert. Stimmt noch alles?");
  }
  return reasons;
}

export interface AreaState {
  area: VorsorgeArea;
  status: AreaStatus;
  missing: string[];
  reviewReasons: string[];
  updatedAt: string | null;
}

export function getAreaState(data: AmanahOrdnerData, area: VorsorgeArea, now: Date = new Date()): AreaState {
  const missing = area.core.filter((c) => !c.done(data)).map((c) => c.label);
  const updatedAt = data.vorsorgeMeta?.areaUpdatedAt?.[area.id] ?? null;
  if (!isAreaStarted(data, area)) return { area, status: "nicht_begonnen", missing, reviewReasons: [], updatedAt };
  const reviewReasons = getReviewReasons(data, area, now);
  const status: AreaStatus = reviewReasons.length > 0 ? "pruefen" : missing.length === 0 ? "vollstaendig" : "begonnen";
  return { area, status, missing, reviewReasons, updatedAt };
}

export function getAllAreaStates(data: AmanahOrdnerData, now: Date = new Date()): AreaState[] {
  return VORSORGE_AREAS.map((area) => getAreaState(data, area, now));
}

/** Which areas a change between two folder states touched. */
export function changedAreas(before: Partial<AmanahOrdnerData>, after: Partial<AmanahOrdnerData>): VorsorgeAreaId[] {
  const ids = new Set<VorsorgeAreaId>();
  for (const [section, id] of SECTION_TO_AREA) {
    if (before[section] !== after[section]) ids.add(id);
  }
  return [...ids];
}

export function formatAreaDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
