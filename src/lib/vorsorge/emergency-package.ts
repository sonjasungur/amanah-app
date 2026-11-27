import type { AmanahOrdnerData, DocumentType } from "@/lib/domain/types";
import { DOCUMENT_CHECKLIST, DOCUMENT_STATUS_LABELS } from "@/lib/vorsorge/documents";
import { ASSET_TYPES } from "@/lib/testament/asset-labels";
import { debtTypeLabels } from "@/lib/vorsorge/labels";
import { digitalEntrySummary } from "@/lib/vorsorge/digital-legacy";
import { powerOfAttorneyRows } from "@/lib/vorsorge/power-of-attorney";
import { formatDisplayDate, toIsoDate } from "@/lib/utils/date-input";

/**
 * The offline emergency package: a printout the person compiles and hands over themselves.
 * Nothing is sent or shared online. Only what the person selected is put on the page.
 */
export type PackageItemId =
  | "kontakte"
  | "vollmacht"
  | "dokumente"
  | "gesundheit"
  | "janazah"
  | "nachricht"
  | "schulden"
  | "vermoegen"
  | "digital";

export type PackagePart = "notfall" | "todesfall";

export interface PackageItem {
  id: PackageItemId;
  part: PackagePart;
  label: string;
  description: string;
  /** Needs its own confirmation and is never preselected. */
  sensitive: boolean;
  defaultSelected: boolean;
}

export const PACKAGE_ITEMS: readonly PackageItem[] = [
  { id: "kontakte", part: "notfall", label: "Notfallkontakte", description: "Name, Notfallkontakte, Hausarzt, Moschee", sensitive: false, defaultSelected: true },
  { id: "vollmacht", part: "notfall", label: "Wer für mich handeln soll", description: "Vorgesehene Personen und ob es die Dokumente gibt", sensitive: false, defaultSelected: true },
  { id: "dokumente", part: "notfall", label: "Wo meine Dokumente liegen", description: "Nur Status und Ablageort, keine Inhalte", sensitive: false, defaultSelected: true },
  { id: "gesundheit", part: "notfall", label: "Gesundheitsangaben", description: "Krankheiten, Medikamente, Allergien, Wünsche bei Krankheit", sensitive: true, defaultSelected: false },
  { id: "janazah", part: "todesfall", label: "Janazah- und Bestattungswünsche", description: "Bestattung, Moschee, Bestatter, Ghusl", sensitive: false, defaultSelected: true },
  { id: "nachricht", part: "todesfall", label: "Persönliche Nachricht an die Familie", description: "Aus Janazah-Wünschen und Familienbrief", sensitive: false, defaultSelected: false },
  { id: "schulden", part: "todesfall", label: "Schulden & Amanah", description: "Offene Schulden, Anvertrautes, Zakat", sensitive: true, defaultSelected: false },
  { id: "vermoegen", part: "todesfall", label: "Vermögensübersicht", description: "Was es gibt und wo die Unterlagen liegen", sensitive: true, defaultSelected: false },
  { id: "digital", part: "todesfall", label: "Digitaler Nachlass", description: "Hinweise zu Konten, niemals Passwörter", sensitive: true, defaultSelected: false },
];

export const PART_TITLES: Record<PackagePart, string> = {
  notfall: "Teil 1: Sofort im Notfall",
  todesfall: "Teil 2: Wünsche für den Todesfall",
};

export const PACKAGE_NOTICE =
  "Persönliche Wünsche und Hinweise. Kein Testament, keine Vollmacht, keine Patientenverfügung. Rechtlich gelten nur die Originaldokumente.";

export function defaultSelection(): Set<PackageItemId> {
  return new Set(PACKAGE_ITEMS.filter((i) => i.defaultSelected).map((i) => i.id));
}

export interface PackageRow {
  label: string;
  value: string;
}

export interface PackageSection {
  id: PackageItemId;
  title: string;
  rows: PackageRow[];
}

const yesNo = (value: boolean | null) => (value === null ? "" : value ? "Ja" : "Nein");

function rows(entries: [string, string | null | undefined][]): PackageRow[] {
  return entries.filter(([, v]) => typeof v === "string" && v.trim().length > 0).map(([label, value]) => ({ label, value: (value as string).trim() }));
}

function contact(c: { name: string; phone: string; relation: string }): string {
  return [c.name, c.relation && `(${c.relation})`, c.phone].filter(Boolean).join(" ");
}

function docLocation(data: AmanahOrdnerData, type: DocumentType): string {
  const doc = data.documents.find((d) => d.type === type);
  if (!doc?.status) return "";
  return [DOCUMENT_STATUS_LABELS[doc.status], doc.location].filter(Boolean).join(", ");
}

function sectionFor(data: AmanahOrdnerData, id: PackageItemId): PackageRow[] {
  const card = data.emergencyCard;
  switch (id) {
    case "kontakte":
      return rows([
        ["Name", card.name],
        // Same calendar check as the documents: an unfinished or impossible date is left out (P2.6, F1).
        ["Geburtsdatum", formatDisplayDate(toIsoDate(card.birthDate ?? "") ?? "")],
        ["Sprache", card.language],
        ["Notfallkontakt 1", contact(card.emergencyContact1)],
        ["Notfallkontakt 2", contact(card.emergencyContact2)],
        ["Hausarzt", card.familyDoctor],
        ["Moschee / Imam", card.mosqueImam],
      ]);
    case "vollmacht":
      return rows([
        // Wishes for the power of attorney (new structure, old texts as "früher eingetragen").
        ...powerOfAttorneyRows(data).map(([label, value]) => [label === "Vorgesehene Person" ? "Vorgesehene Person (Vollmacht)" : label, value ?? ""] as [string, string]),
        ["Patientenverfügung vorhanden", yesNo(card.hasPatientenverfuegung)],
        ["Vorsorgevollmacht vorhanden", yesNo(card.hasVorsorgevollmacht)],
        ["Wo liegt die Patientenverfügung", data.medicalWishes.documentLocation || docLocation(data, "patientenverfuegung")],
        ["Vorsorgevollmacht", docLocation(data, "vorsorgevollmacht")],
      ]);
    case "dokumente":
      return rows(DOCUMENT_CHECKLIST.map((c) => [c.title, docLocation(data, c.type)]));
    case "gesundheit":
      return rows([
        ["Krankheiten", card.illnesses],
        ["Medikamente", card.medications],
        ["Allergien", card.allergies],
        ["Wünsche zur Behandlung", data.medicalWishes.medicalWishes],
        ["Religiöse Wünsche", data.medicalWishes.religiousWishes],
        ["Imam / Seelsorge", data.medicalWishes.imamSeelsorge],
      ]);
    case "janazah": {
      const j = data.janazahWishes;
      const repatriation = { yes: "Ja", no: "Nein", unsure: "Noch unsicher", "": "" }[j.repatriation];
      return rows([
        ["Islamische Bestattung gewünscht", yesNo(j.islamicBurialDesired)],
        ["Ohne unnötige Verzögerung", yesNo(j.noUnnecessaryDelay)],
        ["Vertrauensperson", j.trustedContact],
        ["Moschee", j.preferredMosque || j.mosqueCommunity],
        ["Bestatter", j.preferredFuneralDirector || card.preferredFuneralDirector],
        ["Beisetzung in Deutschland", yesNo(j.burialGermany)],
        ["Überführung", repatriation],
        ["Friedhof", j.preferredCemetery],
        ["Wer bei der Waschung dabei sein darf", data.ghuslKafan.whoMayBePresent],
        ["Ghusl", j.ghusl],
        ["Wer informiert werden soll", j.peopleToNotify],
      ]);
    }
    case "nachricht":
      return rows([
        ["Nachricht an die Familie", data.janazahWishes.messageToFamily],
        ["Familienbrief", data.familyMessage.familyLetter],
      ]);
    case "schulden":
      return data.debtsAmanah.map((d) => ({
        label: debtTypeLabels[d.type] ?? "Eintrag",
        value: [d.description, d.person].filter(Boolean).join(" – "),
      }));
    case "vermoegen":
      return data.assets.map((a) => ({
        label: ASSET_TYPES[a.type] ?? "Vermögen",
        value: [a.description, a.locationHint && `Unterlagen: ${a.locationHint}`].filter(Boolean).join(" – "),
      }));
    case "digital":
      return data.digitalLegacy.map((d) => {
        const s = digitalEntrySummary(data, d);
        return { label: s.kind, value: [s.title, s.detail].filter(Boolean).join(" – ") };
      });
  }
}

/** Only selected items, in a fixed order, split into the two parts. Sensitive items need `confirmed`. */
export function buildPackage(
  data: AmanahOrdnerData,
  selected: ReadonlySet<PackageItemId>,
  confirmed: ReadonlySet<PackageItemId>,
): Record<PackagePart, PackageSection[]> {
  const result: Record<PackagePart, PackageSection[]> = { notfall: [], todesfall: [] };
  for (const item of PACKAGE_ITEMS) {
    if (!selected.has(item.id)) continue;
    if (item.sensitive && !confirmed.has(item.id)) continue;
    result[item.part].push({ id: item.id, title: item.label, rows: sectionFor(data, item.id) });
  }
  return result;
}
