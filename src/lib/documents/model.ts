import type { AmanahOrdnerData, FamilyRole } from "@/lib/domain/types";
import { formatDisplayDate } from "@/lib/utils/date-input";
import { ASSET_TYPES, MORTGAGE, OWNERSHIP } from "@/lib/testament/asset-labels";
import { DOCUMENT_CHECKLIST, DOCUMENT_STATUS_LABELS } from "@/lib/vorsorge/documents";
import { debtTypeLabels, digitalTypeLabels } from "@/lib/vorsorge/labels";
import { ROLE_LABELS } from "@/lib/vorsorge/people";
import { inheritanceConversationPoints } from "@/lib/domain/validation";
import { moduleText } from "@/lib/content/module-texts";

/**
 * Documents as data first: what a printout shows, what is missing and what contradicts. Rendering
 * (screen preview and print) only draws this model, so empty values are never printed at random.
 *
 * Values: a text or "Ja"/"Nein"; 0 stays "0"; nothing entered is left out of the sections and named
 * in `missing` instead, so "not stated", "no" and "0" never look alike.
 */
export interface DocRow {
  label: string;
  value: string;
}

export type DocBlock =
  | { kind: "rows"; rows: DocRow[] }
  | { kind: "text"; text: string }
  | { kind: "list"; items: { title: string; detail?: string }[] };

export interface DocSection {
  title: string;
  note?: string;
  blocks: DocBlock[];
}

export type DocumentId = "notfallkarte" | "notfallinfo" | "leitfaden" | "gesamt" | "janazah" | "erbprofil" | "familienbrief" | "schulden" | "vermoegen";

export interface DocModel {
  id: DocumentId;
  title: string;
  /** What the document is and what it is not, printed under the title. */
  status: string;
  /** Repeated on every printed page (overview only). */
  pageNotice?: string;
  sections: DocSection[];
  /** Important details that were not entered. */
  missing: string[];
  /** Entries that contradict each other. */
  warnings: string[];
  /** False when there is nothing worth printing; the preview then explains instead of offering a print. */
  hasContent: boolean;
  /** Where to fill it in when it is empty. */
  editPath: string;
}

export interface DocOptions {
  /** Health details only with an explicit choice for this printout. */
  includeHealth?: boolean;
  /** Only for the (locked) inheritance hints. */
  inheritanceHints?: boolean;
}

type Raw = string | number | boolean | null | undefined;

/** "Ja"/"Nein" for booleans, the number for numbers (also 0), trimmed text; null when nothing was entered. */
export function docValue(raw: Raw): string | null {
  if (raw === null || raw === undefined) return null;
  if (typeof raw === "boolean") return raw ? "Ja" : "Nein";
  if (typeof raw === "number") return Number.isFinite(raw) ? String(raw) : null;
  const text = raw.trim();
  return text ? text : null;
}

const YES_NO_UNSURE: Record<string, string> = { yes: "Ja", no: "Nein", unsure: "Noch unsicher", ja: "Ja", nein: "Nein", unsicher: "Noch unsicher", conditional: "Unter Bedingungen" };
const enumValue = (raw: string | undefined | null, map: Record<string, string>) => (raw ? (map[raw] ?? raw) : null);

function rows(pairs: [string, string | null][]): DocBlock | null {
  const filled = pairs.filter((p): p is [string, string] => p[1] !== null).map(([label, value]) => ({ label, value }));
  return filled.length ? { kind: "rows", rows: filled } : null;
}

function section(title: string, blocks: (DocBlock | null)[], note?: string): DocSection | null {
  const kept = blocks.filter((b): b is DocBlock => b !== null);
  return kept.length ? { title, blocks: kept, note } : null;
}

function finish(model: Omit<DocModel, "sections" | "hasContent"> & { sections: (DocSection | null)[] }, minSections = 1): DocModel {
  const sections = model.sections.filter((s): s is DocSection => s !== null);
  return { ...model, sections, hasContent: sections.length >= minSections };
}

/** The language has a default ("Deutsch"); alone it is no reason to print a card. */
const languageOf = (c: AmanahOrdnerData["emergencyCard"]) =>
  docValue(c.name) || docValue(c.emergencyContact1.name) ? docValue(c.language) : null;

const contact = (c: { name: string; phone: string; relation: string }) =>
  docValue([c.name, c.relation && `(${c.relation})`, c.phone && `· ${c.phone}`].filter(Boolean).join(" "));

function documentPlace(data: AmanahOrdnerData, type: (typeof DOCUMENT_CHECKLIST)[number]["type"]): string | null {
  const doc = data.documents.find((d) => d.type === type);
  if (!doc?.status) return null;
  return [DOCUMENT_STATUS_LABELS[doc.status], doc.location?.trim()].filter(Boolean).join(" · ");
}

function emergencyWarnings(data: AmanahOrdnerData): string[] {
  const w: string[] = [];
  const pv = data.documents.find((d) => d.type === "patientenverfuegung")?.status;
  const vv = data.documents.find((d) => d.type === "vorsorgevollmacht")?.status;
  if (data.emergencyCard.hasPatientenverfuegung === true && pv === "fehlt") w.push("Patientenverfügung: Notfallkarte sagt „vorhanden“, Dokumentenliste sagt „fehlt noch“.");
  if (data.emergencyCard.hasVorsorgevollmacht === true && vv === "fehlt") w.push("Vorsorgevollmacht: Notfallkarte sagt „vorhanden“, Dokumentenliste sagt „fehlt noch“.");
  return w;
}

function healthSection(data: AmanahOrdnerData, options: DocOptions): DocSection | null {
  if (!options.includeHealth) return null;
  const c = data.emergencyCard;
  return section("Medizinische Hinweise", [rows([["Allergien", docValue(c.allergies)], ["Medikamente", docValue(c.medications)], ["Erkrankungen", docValue(c.illnesses)]])]);
}

/** One page for the wallet or the fridge: who to call and what doctors must know first. */
export function buildNotfallkarte(data: AmanahOrdnerData, options: DocOptions = {}): DocModel {
  const c = data.emergencyCard;
  const missing = [
    !docValue(c.name) && "Name",
    !docValue(c.emergencyContact1.name) && "Erster Notfallkontakt",
    !docValue(c.emergencyContact1.phone) && "Telefonnummer des ersten Notfallkontakts",
  ].filter(Boolean) as string[];
  return finish({
    id: "notfallkarte",
    title: "Notfallkarte",
    status: "Für den Notfall. Kein rechtliches Dokument.",
    editPath: "/dashboard/notfallkarte",
    missing,
    warnings: emergencyWarnings(data),
    sections: [
      section("Person", [rows([["Name", docValue(c.name)], ["Geburtsdatum", docValue(formatDisplayDate(c.birthDate))], ["Sprache", languageOf(c)]])]),
      section("Im Notfall anrufen", [rows([["Kontakt 1", contact(c.emergencyContact1)], ["Kontakt 2", contact(c.emergencyContact2)], ["Hausarzt", docValue(c.familyDoctor)]])]),
      healthSection(data, options),
      section("Wichtige Dokumente", [
        rows([
          ["Patientenverfügung", documentPlace(data, "patientenverfuegung") ?? enumValue(c.hasPatientenverfuegung === null ? null : String(c.hasPatientenverfuegung), { true: "Vorhanden", false: "Keine" })],
          ["Vorsorgevollmacht", documentPlace(data, "vorsorgevollmacht") ?? enumValue(c.hasVorsorgevollmacht === null ? null : String(c.hasVorsorgevollmacht), { true: "Vorhanden", false: "Keine" })],
        ]),
      ]),
    ],
  });
}

const ROLE_ORDER: FamilyRole[] = ["notfallkontakt", "vertrauensperson", "vormund_wunsch"];

/** Everything a helper needs in the first hours, without the wishes for the time after death. */
export function buildNotfallinfo(data: AmanahOrdnerData, options: DocOptions = {}): DocModel {
  const c = data.emergencyCard;
  const people = data.familyMembers.map((m) => ({
    title: `${m.name}${m.relation ? ` (${m.relation})` : ""}`,
    detail: [m.phone, (m.roles ?? []).sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)).map((r) => ROLE_LABELS[r]).join(", ")].filter(Boolean).join(" · ") || undefined,
  }));
  const places = DOCUMENT_CHECKLIST.map((d) => [d.title, documentPlace(data, d.type)] as [string, string | null]);
  return finish({
    id: "notfallinfo",
    title: "Notfallinformationen",
    status: "Ausführliche Informationen für Helfende. Kein rechtliches Dokument.",
    editPath: "/dashboard/notfallkarte",
    missing: [!docValue(c.emergencyContact1.name) && "Erster Notfallkontakt"].filter(Boolean) as string[],
    warnings: emergencyWarnings(data),
    sections: [
      section("Person", [rows([["Name", docValue(c.name)], ["Geburtsdatum", docValue(formatDisplayDate(c.birthDate))], ["Sprache", languageOf(c)]])]),
      section("Kontakte", [rows([["Kontakt 1", contact(c.emergencyContact1)], ["Kontakt 2", contact(c.emergencyContact2)], ["Hausarzt", docValue(c.familyDoctor)]]), people.length ? { kind: "list", items: people } : null]),
      healthSection(data, options),
      section("Wo die Dokumente liegen", [rows(places)]),
      section("Im Todesfall ansprechen", [rows([["Moschee / Imam", docValue(c.mosqueImam) ?? docValue(data.janazahWishes.preferredMosque)], ["Bestatter", docValue(c.preferredFuneralDirector) ?? docValue(data.janazahWishes.preferredFuneralDirector)]])]),
    ],
  });
}

/** Personal wishes for washing, prayer and burial. */
export function buildJanazah(data: AmanahOrdnerData): DocModel {
  const j = data.janazahWishes;
  const g = data.ghuslKafan;
  const b = data.burialPreference;
  return finish({
    id: "janazah",
    title: "Janazah-Wünsche",
    status: "Persönliche Wünsche für die Familie. Keine rechtliche Verfügung.",
    editPath: "/dashboard/janazah",
    missing: [j.islamicBurialDesired === null && "Ob eine islamische Bestattung gewünscht ist", !docValue(j.preferredFuneralDirector) && !docValue(j.preferredMosque) && "Bestatter oder Moschee"].filter(Boolean) as string[],
    warnings: data.emergencyCard.hasJanazahWishes === false && j.islamicBurialDesired !== null ? ["Notfallkarte sagt „keine Janazah-Wünsche“, es sind aber Wünsche eingetragen."] : [],
    sections: [
      section("Grundwünsche", [rows([["Name", docValue(j.fullName)], ["Islamische Bestattung gewünscht", docValue(j.islamicBurialDesired)], ["Ohne unnötige Verzögerung", docValue(j.noUnnecessaryDelay)], ["Vertrauensperson", docValue(j.trustedContact)]])]),
      section("Wen informieren", [rows([["Personen", docValue(j.peopleToNotify)], ["Moschee / Gemeinde", docValue(j.mosqueCommunity)], ["Weitere Kontakte", docValue(j.additionalContacts)]])]),
      section("Ghusl und Kafan", [
        rows([["Ghusl", docValue(j.ghusl)], ["Bevorzugte Personen", docValue(j.preferredGhuslPersons) ?? docValue(g.preferredGhuslTeam)], ["Wer anwesend sein darf", docValue(g.whoMayBePresent)], ["Würde und Privatsphäre", docValue(g.dignityBoundaries)], ["Kafan", docValue(j.kafan)], ["Abschied der Familie", enumValue(g.familyFarewell, YES_NO_UNSURE)], ["Bedingungen", docValue(g.familyFarewellConditions)]]),
      ]),
      section("Gebet und Beisetzung", [
        rows([["Janazah-Gebet", docValue(j.janazahPrayer)], ["Moschee", docValue(j.preferredMosque)], ["Bestatter", docValue(j.preferredFuneralDirector)], ["Beisetzung in Deutschland", docValue(j.burialGermany)], ["Überführung", enumValue(j.repatriation, YES_NO_UNSURE)], ["Friedhof", docValue(j.preferredCemetery)], ["Muslimisches Gräberfeld", docValue(j.muslimGraveyard)], ["Familiengrab", docValue(j.familyGrave)], ["Ort / PLZ", docValue(b.cityPlz)], ["Ansprechperson", docValue(b.contactPerson)]]),
      ]),
      section("Persönliches", [rows([["Nicht gewünschte Bräuche", docValue(j.culturalExclusions)], ["Spendenwünsche", docValue(j.donationWishes)], ["Weitere Wünsche", docValue(j.additionalWishes)]])]),
      section("Nachricht an die Familie", [docValue(j.messageToFamily) ? { kind: "text", text: j.messageToFamily.trim() } : null]),
    ],
  });
}

/** Facts and questions for the talk with scholars, lawyer or notary. Never a will, never shares. */
export function buildErbprofil(data: AmanahOrdnerData): DocModel {
  const p = data.inheritanceProfile;
  const touched = p.married !== null || p.sons > 0 || p.daughters > 0 || p.parentsAlive !== null;
  const points = inheritanceConversationPoints(p);
  const pointList: DocBlock | null = points.length ? { kind: "list", items: points.map((title) => ({ title })) } : null;
  return finish({
    id: "erbprofil",
    title: "Erbprofil für das Gespräch",
    status: `Kein Testament. Es berechnet keine Anteile. ${moduleText("testament-form-pdf")}`,
    editPath: "/dashboard/testament",
    missing: [p.married === null && "Familienstand", p.parentsAlive === null && "Ob die Eltern leben"].filter(Boolean) as string[],
    warnings: p.married === false && p.spouseAlive === true ? ["„Nicht verheiratet“ und „Ehepartner lebt“ widersprechen sich."] : [],
    sections: [
      section("Familie", [
        rows([["Verheiratet", docValue(p.married)], ["Ehepartner lebt", docValue(p.spouseAlive)], ["Söhne", touched ? docValue(p.sons) : null], ["Töchter", touched ? docValue(p.daughters) : null], ["Eltern leben", docValue(p.parentsAlive)], ["Geschwister", docValue(p.siblings)], ["Stiefkinder", docValue(p.stepchildren)], ["Pflegekinder", docValue(p.fosterChildren)], ["Nicht-muslimische Angehörige", docValue(p.nonMuslimRelatives)]]),
      ]),
      section("Vermögen", [rows([["Immobilien", docValue(p.realEstate)], ["Firma / GmbH", docValue(p.companyGmbH)], ["Eigentum im Ausland", docValue(p.foreignProperty)], ["Vermögen grob", docValue(p.approximateWealth)], ["Schulden", docValue(p.debts)]])]),
      section("Notizen (unverbindlich)", [rows([["Notizen zur Waṣiyya", docValue(p.desiredWasiyyah)], ["Notizen zur Sadaqa Jariya", docValue(p.desiredSadaqaJariya)]])]),
      section("Fragen für das Gespräch", [pointList, rows([["An den Imam", docValue(p.openQuestionsImam)], ["An Anwalt oder Notar", docValue(p.openQuestionsLawyer)]])]),
    ],
  });
}

export function buildFamilienbrief(data: AmanahOrdnerData): DocModel {
  const f = data.familyMessage;
  return finish({
    id: "familienbrief",
    title: "Brief an meine Familie",
    status: "Persönliche Worte. Kein rechtliches Dokument.",
    editPath: "/dashboard/familie",
    missing: docValue(f.familyLetter) ? [] : ["Der Brief selbst"],
    warnings: [],
    sections: [
      section("Brief", [docValue(f.familyLetter) ? { kind: "text", text: f.familyLetter.trim() } : null]),
      section("Das Wichtigste in Kürze", [docValue(f.keyWishesSummary) ? { kind: "text", text: f.keyWishesSummary.trim() } : null]),
    ],
  });
}

const PRIORITY: Record<string, string> = { high: "hoch", medium: "mittel", low: "niedrig" };

export function buildSchulden(data: AmanahOrdnerData): DocModel {
  const groups = new Map<string, { title: string; detail?: string }[]>();
  for (const d of data.debtsAmanah) {
    const key = debtTypeLabels[d.type] ?? "Sonstiges";
    const list = groups.get(key) ?? [];
    list.push({ title: d.description, detail: [d.person && `Person/Stelle: ${d.person}`, `Priorität: ${PRIORITY[d.priority] ?? d.priority}`].filter(Boolean).join(" · ") });
    groups.set(key, list);
  }
  return finish({
    id: "schulden",
    title: "Schulden und Amanah",
    status: "Übersicht für die Familie. Keine rechtliche Prüfung.",
    editPath: "/dashboard/schulden-amanah",
    missing: data.debtsAmanah.length ? [] : ["Noch keine Einträge"],
    warnings: [],
    sections: [...groups.entries()].map(([title, items]) => section(title, [{ kind: "list", items }])),
  });
}

export const ASSET_DOC_NOTICE =
  "Kein Testament. Reine Bestandsaufnahme: Sie regelt nicht, wer etwas erhält. Beträge und Notizen werden nicht gedruckt.";

/** What exists and where the papers are. Amounts and free notes are deliberately left out. */
export function buildVermoegen(data: AmanahOrdnerData): DocModel {
  return finish({
    id: "vermoegen",
    title: "Vermögensübersicht",
    status: ASSET_DOC_NOTICE,
    editPath: "/dashboard/vermoegen",
    missing: data.assets.length ? [] : ["Noch keine Einträge"],
    warnings: [],
    sections: [
      section("Vermögenswerte", [
        data.assets.length
          ? {
              kind: "list",
              items: data.assets.map((a) => ({
                title: `${ASSET_TYPES[a.type]}: ${a.description}`,
                detail: [a.locationHint && `Unterlagen: ${a.locationHint}`, a.mortgage && `Hypothek oder Kredit: ${MORTGAGE[a.mortgage]}`, a.ownership && `Eigentum: ${OWNERSHIP[a.ownership]}`].filter(Boolean).join(" · ") || undefined,
              })),
            }
          : null,
      ]),
      section("Digitaler Nachlass (ohne Passwörter)", [
        data.digitalLegacy.length ? { kind: "list", items: data.digitalLegacy.map((d) => ({ title: `${digitalTypeLabels[d.type] ?? "Konto"}: ${d.description}`, detail: d.locationHint ? `Hinweis: ${d.locationHint}` : undefined })) } : null,
      ]),
    ],
  });
}

/**
 * "What should my family do?" Concrete people, places and next steps from the person's own entries.
 * General steps only; no individual legal advice.
 */
export function buildLeitfaden(data: AmanahOrdnerData): DocModel {
  const c = data.emergencyCard;
  const j = data.janazahWishes;
  const trusted = data.familyMembers.filter((m) => m.roles?.includes("vertrauensperson"));
  const places = DOCUMENT_CHECKLIST.map((d) => [d.title, documentPlace(data, d.type)] as [string, string | null]);
  const hasPeople = Boolean(docValue(c.emergencyContact1.name) || trusted.length);
  return finish({
    id: "leitfaden",
    title: "Was soll meine Familie im Notfall tun?",
    status: "Ein Leitfaden mit meinen Angaben. Keine Rechtsberatung.",
    editPath: "/dashboard/vorsorge",
    missing: [!docValue(c.emergencyContact1.name) && "Erster Notfallkontakt", !places.some(([, v]) => v) && "Ablageorte der Dokumente"].filter(Boolean) as string[],
    warnings: emergencyWarnings(data),
    sections: [
      hasPeople
        ? section("1. Sofort", [
            { kind: "list", items: [{ title: "Bei Lebensgefahr: Notruf 112." }] },
            rows([["Zuerst anrufen", contact(c.emergencyContact1)], ["Danach", contact(c.emergencyContact2)], ["Hausarzt", docValue(c.familyDoctor)]]),
          ])
        : null,
      section("2. Wer meine Wünsche kennt", [
        trusted.length ? { kind: "list", items: trusted.map((m) => ({ title: m.name, detail: [m.relation, m.phone].filter(Boolean).join(" · ") || undefined })) } : null,
        rows([["Vorgesehen für die Vollmacht", docValue(data.powerOfAttorney.authorizedPerson)], ["Ersatzperson", docValue(data.powerOfAttorney.substitutePerson)]]),
      ], "Die Nennung hier ist keine Vollmacht."),
      section("3. Wo meine Unterlagen liegen", [rows(places)]),
      section("4. Im Todesfall", [
        rows([["Bestatter", docValue(j.preferredFuneralDirector) ?? docValue(c.preferredFuneralDirector)], ["Moschee / Imam", docValue(j.preferredMosque) ?? docValue(c.mosqueImam)], ["Vertrauensperson", docValue(j.trustedContact)]]),
        j.islamicBurialDesired !== null ? { kind: "list", items: [{ title: "Meine Wünsche zu Waschung, Gebet und Beisetzung stehen im Dokument „Janazah-Wünsche“." }] } : null,
      ]),
      hasPeople || places.some(([, v]) => v)
        ? section("5. Was dieser Leitfaden nicht ist", [{ kind: "text", text: "Er ersetzt keine Vollmacht, kein Testament und keine Beratung. Fragen zu Erbe und Formalitäten klären Anwalt, Notar oder das Nachlassgericht; religiöse Fragen ein Imam oder Gelehrte." }])
        : null,
    ],
  });
}

export const FULL_DOC_NOTICE = "Persönliche Übersicht: kein Testament, keine Vollmacht, keine Patientenverfügung";

/** All entries for looking things up, each part labelled with what it is not. */
export function buildGesamt(data: AmanahOrdnerData, options: DocOptions = {}): DocModel {
  const parts = [buildNotfallinfo(data, options), buildJanazah(data), buildErbprofil(data), buildSchulden(data), buildVermoegen(data), buildFamilienbrief(data)];
  const m = data.medicalWishes;
  const v = data.powerOfAttorney;
  const care = data.careDirective;
  const prefix = (title: string, s: DocSection) => ({ ...s, title: `${title}: ${s.title}` });
  return finish({
    id: "gesamt",
    title: "Vorsorge-Übersicht",
    status: `Kein Testament, keine Vollmacht, keine Patientenverfügung, keine Betreuungsverfügung. Sammelt deine Angaben zum Nachschlagen. ${moduleText("testament-form-print")} ${moduleText("vorsorge-documents-print")}`,
    pageNotice: FULL_DOC_NOTICE,
    editPath: "/dashboard",
    missing: parts.flatMap((p) => (p.hasContent ? [] : [`${p.title}: noch keine Angaben`])),
    warnings: [...new Set(parts.flatMap((p) => p.warnings))],
    sections: [
      ...parts[0].sections.map((s) => prefix("Notfall", s)),
      section("Wünsche zur medizinischen Behandlung (keine Patientenverfügung)", [rows([["Medizinische Wünsche", docValue(m.medicalWishes)], ["Religiöse Wünsche", docValue(m.religiousWishes)], ["Imam / Seelsorge", docValue(m.imamSeelsorge)], ["Wer mit Ärzten sprechen soll", docValue(m.whoSpeaksToDoctors)], ["Wo die Patientenverfügung liegt", docValue(m.documentLocation)]])]),
      section("Angaben zur Vollmacht (keine Vollmacht)", [rows([["Vorgesehene Person", docValue(v.authorizedPerson)], ["Ersatzperson", docValue(v.substitutePerson)], ["Wer nicht entscheiden soll", docValue(v.excludedPersons)]])]),
      section("Wünsche zur Betreuung (keine Betreuungsverfügung)", [rows([["Gewünschter Betreuer", docValue(care.preferredGuardian)], ["Nicht gewünscht", docValue(care.excludedGuardian)], ["Wünsche zu Pflege und Wohnen", docValue(care.careHousingWishes)]])]),
      ...parts[1].sections.map((s) => prefix("Janazah", s)),
      ...parts[2].sections.map((s) => prefix("Erbprofil (kein Testament)", s)),
      ...parts[3].sections.map((s) => prefix("Schulden und Amanah", s)),
      ...parts[4].sections.map((s) => prefix("Vermögen (Bestandsaufnahme, kein Testament)", s)),
      ...parts[5].sections.map((s) => prefix("Familienbrief", s)),
    ],
  });
}

export interface DocumentInfo {
  id: DocumentId;
  title: string;
  description: string;
  build: (data: AmanahOrdnerData, options?: DocOptions) => DocModel;
  /** Whether health details can be added on request. */
  health?: boolean;
}

export const DOCUMENTS: readonly DocumentInfo[] = [
  { id: "notfallkarte", title: "Notfallkarte", description: "Eine Seite, dazu eine Karte fürs Portemonnaie.", build: buildNotfallkarte, health: true },
  { id: "notfallinfo", title: "Notfallinformationen", description: "Ausführlich für Helfende: Kontakte, Ärzte, Ablageorte.", build: buildNotfallinfo, health: true },
  { id: "leitfaden", title: "Leitfaden für die Familie", description: "Was im Notfall zu tun ist: wen anrufen, wo die Unterlagen liegen.", build: buildLeitfaden },
  { id: "gesamt", title: "Vorsorge-Übersicht", description: "Alle Angaben zum Nachschlagen. Kein Testament, keine Vollmacht.", build: buildGesamt, health: true },
  { id: "janazah", title: "Janazah-Wünsche", description: "Waschung, Gebet und Beisetzung für die Familie.", build: buildJanazah },
  { id: "erbprofil", title: "Erbprofil für das Gespräch", description: "Fakten und Fragen für Gelehrte, Anwalt oder Notar. Kein Testament.", build: buildErbprofil },
  { id: "familienbrief", title: "Brief an meine Familie", description: "Dein Brief in deinen Worten.", build: buildFamilienbrief },
  { id: "schulden", title: "Schulden und Amanah", description: "Offenes und Anvertrautes, nach Art geordnet.", build: buildSchulden },
  { id: "vermoegen", title: "Vermögensübersicht", description: "Was es gibt und wo die Unterlagen liegen. Ohne Beträge.", build: buildVermoegen },
];

/** File name suggestion: what and when, never a person's name. */
export function documentFileTitle(model: DocModel, date: Date = new Date()): string {
  const slug = model.title.normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/ß/g, "ss").replace(/[^A-Za-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `Amanah-${slug}-${date.toISOString().slice(0, 10)}`;
}
