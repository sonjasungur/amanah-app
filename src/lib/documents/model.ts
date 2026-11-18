import type { AmanahOrdnerData, FamilyRole } from "@/lib/domain/types";
import { formatDisplayDate } from "@/lib/utils/date-input";
import { ASSET_TYPES, MORTGAGE, OWNERSHIP } from "@/lib/testament/asset-labels";
import { DOCUMENT_CHECKLIST, DOCUMENT_STATUS_LABELS } from "@/lib/vorsorge/documents";
import { debtTypeLabels, digitalTypeLabels } from "@/lib/vorsorge/labels";
import { ROLE_LABELS } from "@/lib/vorsorge/people";
import { legalDocumentStates } from "@/lib/vorsorge/handover";
import { inheritanceConversationPoints } from "@/lib/domain/validation";
import { moduleText } from "@/lib/content/module-texts";

/**
 * Documents as data first: what a printout shows, what is missing and what contradicts. Rendering
 * (screen preview and print) only draws this model, so empty values are never printed at random.
 *
 * Values: a text or "Ja"/"Nein"; 0 stays "0"; nothing entered is left out of the sections and named
 * in `missing` instead, so "not stated", "no" and "0" never look alike.
 *
 * P2.5: sections carry an icon and are numbered by the view; contacts, next steps and notices are
 * their own blocks, so documents read as guidance for people and not as a field table. Sections
 * derived from the entries (next steps, open questions) only appear when something was entered.
 */
export interface DocRow {
  label: string;
  value: string;
}

export interface DocContact {
  name: string;
  /** Why this person or place matters ("Erster Notfallkontakt · Ehefrau"). */
  role: string;
  phone?: string;
  note?: string;
}

export type DocBlock =
  | { kind: "rows"; rows: DocRow[] }
  | { kind: "text"; text: string }
  | { kind: "list"; items: { title: string; detail?: string }[] }
  | { kind: "contacts"; items: DocContact[] }
  | { kind: "steps"; items: { title: string; detail?: string }[] }
  | { kind: "callout"; tone: "important" | "info"; text: string }
  | { kind: "subhead"; text: string };

export type DocIcon =
  | "person"
  | "phone"
  | "health"
  | "documents"
  | "mosque"
  | "water"
  | "layers"
  | "prayer"
  | "place"
  | "message"
  | "question"
  | "steps"
  | "legal"
  | "people"
  | "wallet"
  | "digital"
  | "info"
  | "book";

export interface DocSection {
  title: string;
  note?: string;
  icon?: DocIcon;
  blocks: DocBlock[];
}

export type DocumentId = "notfallkarte" | "notfallinfo" | "leitfaden" | "gesamt" | "janazah" | "erbprofil" | "familienbrief" | "schulden" | "vermoegen";

/** The credit-card sized fold card; built from the same entries as the A4 sheet. */
export interface WalletCardData {
  name: string | null;
  birthDate: string | null;
  language: string | null;
  contacts: { name: string; detail: string | null; phone: string | null }[];
  doctor: string | null;
  /** Only with the explicit choice for this printout. */
  health: DocRow[];
  documents: DocRow[];
  mosque: string | null;
}

export interface DocModel {
  id: DocumentId;
  title: string;
  /** What the document is and what it is not, printed under the title. */
  status: string;
  /** Who the document speaks to. */
  audience?: string;
  /** Name (and birth date) repeated at the top of every printed page, so loose pages stay assignable. */
  identity?: string;
  /** Repeated on every printed page (overview only). */
  pageNotice?: string;
  /** The single most important instruction; the only element printed with a red frame. */
  keyMessage?: string;
  /** Long documents: a cover page with contents. */
  cover?: boolean;
  sections: DocSection[];
  /** Important details that were not entered. */
  missing: string[];
  /** Entries that contradict each other. */
  warnings: string[];
  /** False when there is nothing worth printing; the preview then explains instead of offering a print. */
  hasContent: boolean;
  /** Where to fill it in when it is empty. */
  editPath: string;
  /** Emergency card only: the fold card to cut out, on its own page. */
  card?: WalletCardData;
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

function contacts(items: (DocContact | null)[]): DocBlock | null {
  const kept = items.filter((c): c is DocContact => c !== null);
  return kept.length ? { kind: "contacts", items: kept } : null;
}

function section(title: string, blocks: (DocBlock | null)[], extra: { note?: string; icon?: DocIcon } = {}): DocSection | null {
  // A section with only a subhead or a notice has nothing of the person's own in it.
  const kept = blocks.filter((b): b is DocBlock => b !== null);
  if (!kept.some((b) => b.kind !== "subhead" && b.kind !== "callout")) return null;
  return { title, blocks: kept, ...extra };
}

/** Subheads followed by their blocks; a subhead without content is dropped. */
function grouped(groups: [string, (DocBlock | null)[]][]): DocBlock[] {
  return groups.flatMap(([head, blocks]) => {
    const kept = blocks.filter((b): b is DocBlock => b !== null);
    return kept.length ? [{ kind: "subhead", text: head } as DocBlock, ...kept] : [];
  });
}

type Draft = Omit<DocModel, "sections" | "hasContent"> & {
  sections: (DocSection | null)[];
  /** Sections derived from the entries (steps, open questions); never count as content on their own. */
  derived?: (DocSection | null)[];
};

function finish(model: Draft, minSections = 1): DocModel {
  const { derived = [], ...rest } = model;
  const own = rest.sections.filter((s): s is DocSection => s !== null);
  const hasContent = own.length >= minSections;
  const sections = hasContent ? [...own, ...derived.filter((s): s is DocSection => s !== null)] : own;
  return { ...rest, sections, keyMessage: hasContent ? rest.keyMessage : undefined, hasContent };
}

/** The language has a default ("Deutsch"); alone it is no reason to print a card. */
const languageOf = (c: AmanahOrdnerData["emergencyCard"]) =>
  docValue(c.name) || docValue(c.emergencyContact1.name) ? docValue(c.language) : null;

const contactLine = (c: { name: string; phone: string; relation: string }) =>
  docValue([c.name, c.relation && `(${c.relation})`, c.phone && `· ${c.phone}`].filter(Boolean).join(" "));

function emergencyContact(c: { name: string; phone: string; relation: string }, role: string): DocContact | null {
  const name = docValue(c.name);
  if (!name) return docValue(c.phone) ? { name: "Ohne Namen", role, phone: c.phone.trim() } : null;
  return { name, role: [role, docValue(c.relation)].filter(Boolean).join(" · "), phone: docValue(c.phone) ?? undefined };
}

/** A free-text field (often "name, phone") as a contact card. */
const textContact = (raw: string | undefined, role: string): DocContact | null => {
  const name = docValue(raw);
  return name ? { name, role } : null;
};

function identityOf(name: string | null, birth: string | null): string | undefined {
  if (!name) return undefined;
  return birth ? `${name}, geboren am ${birth}` : name;
}

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

function healthRows(data: AmanahOrdnerData, options: DocOptions): DocBlock | null {
  if (!options.includeHealth) return null;
  const c = data.emergencyCard;
  return rows([["Allergien", docValue(c.allergies)], ["Medikamente", docValue(c.medications)], ["Erkrankungen", docValue(c.illnesses)]]);
}

function healthSection(data: AmanahOrdnerData, options: DocOptions): DocSection | null {
  return section("Medizinische Hinweise", [healthRows(data, options)], { icon: "health" });
}

const EMERGENCY_CALL = "Bei Lebensgefahr sofort den Notruf 112 wählen. Danach die Kontakte unten anrufen.";

function emergencyDocumentRows(data: AmanahOrdnerData): DocBlock | null {
  const c = data.emergencyCard;
  return rows([
    ["Patientenverfügung", documentPlace(data, "patientenverfuegung") ?? enumValue(c.hasPatientenverfuegung === null ? null : String(c.hasPatientenverfuegung), { true: "Vorhanden", false: "Keine" })],
    ["Vorsorgevollmacht", documentPlace(data, "vorsorgevollmacht") ?? enumValue(c.hasVorsorgevollmacht === null ? null : String(c.hasVorsorgevollmacht), { true: "Vorhanden", false: "Keine" })],
  ]);
}

function walletCard(data: AmanahOrdnerData, options: DocOptions): WalletCardData {
  const c = data.emergencyCard;
  const docs = emergencyDocumentRows(data);
  const health = healthRows(data, options);
  return {
    name: docValue(c.name),
    birthDate: docValue(formatDisplayDate(c.birthDate)),
    language: languageOf(c),
    contacts: [c.emergencyContact1, c.emergencyContact2]
      .filter((x) => docValue(x.name) || docValue(x.phone))
      .map((x) => ({ name: docValue(x.name) ?? "Ohne Namen", detail: docValue(x.relation), phone: docValue(x.phone) })),
    doctor: docValue(c.familyDoctor),
    health: health?.kind === "rows" ? health.rows : [],
    // On the card only whether it exists; where it lies stays on the A4 sheet (room for 8 pt text).
    documents: docs?.kind === "rows" ? docs.rows.map((r) => ({ label: r.label, value: r.value.split(" · ")[0] })) : [],
    mosque: docValue(c.mosqueImam) ?? docValue(data.janazahWishes.preferredMosque),
  };
}

/** One A4 sheet for helpers and, on its own page, a fold card for the wallet. */
export function buildNotfallkarte(data: AmanahOrdnerData, options: DocOptions = {}): DocModel {
  const c = data.emergencyCard;
  const name = docValue(c.name);
  const birth = docValue(formatDisplayDate(c.birthDate));
  const missing = [
    !name && "Name",
    !docValue(c.emergencyContact1.name) && "Erster Notfallkontakt",
    !docValue(c.emergencyContact1.phone) && "Telefonnummer des ersten Notfallkontakts",
  ].filter(Boolean) as string[];
  return finish({
    id: "notfallkarte",
    title: "Notfallkarte",
    status: "Für den Notfall. Kein rechtliches Dokument.",
    audience: "Für Ersthelfende, Rettungsdienst und Klinik",
    identity: identityOf(name, birth),
    keyMessage: EMERGENCY_CALL,
    editPath: "/dashboard/notfallkarte",
    missing,
    warnings: emergencyWarnings(data),
    card: walletCard(data, options),
    sections: [
      section("Wer ich bin", [rows([["Name", name], ["Geburtsdatum", birth], ["Sprache", languageOf(c)]])], { icon: "person" }),
      section("Im Notfall bitte anrufen", [
        contacts([emergencyContact(c.emergencyContact1, "Erster Notfallkontakt"), emergencyContact(c.emergencyContact2, "Zweiter Notfallkontakt"), textContact(c.familyDoctor, "Hausarztpraxis")]),
      ], { icon: "phone" }),
      healthSection(data, options),
      section("Wichtige Dokumente", [emergencyDocumentRows(data)], { icon: "documents", note: "Wo die Originale liegen. Die Angabe hier ersetzt das Dokument nicht." }),
      section("Im Todesfall bitte informieren", [contacts([textContact(c.mosqueImam, "Moschee oder Imam"), textContact(c.preferredFuneralDirector, "Bestatter")])], { icon: "mosque" }),
    ],
  });
}

const ROLE_ORDER: FamilyRole[] = ["notfallkontakt", "vertrauensperson", "vormund_wunsch"];

function peopleContacts(data: AmanahOrdnerData, only?: FamilyRole[]): DocContact[] {
  return data.familyMembers
    .filter((m) => docValue(m.name) && (!only || (m.roles ?? []).some((r) => only.includes(r))))
    .map((m) => ({
      name: m.name.trim(),
      role: [docValue(m.relation), [...(m.roles ?? [])].sort((a, b) => ROLE_ORDER.indexOf(a) - ROLE_ORDER.indexOf(b)).map((r) => ROLE_LABELS[r]).join(", ")].filter(Boolean).join(" · ") || "Angehörige Person",
      phone: docValue(m.phone) ?? undefined,
    }));
}

/** Everything a helper needs in the first hours, without the wishes for the time after death. */
export function buildNotfallinfo(data: AmanahOrdnerData, options: DocOptions = {}): DocModel {
  const c = data.emergencyCard;
  const name = docValue(c.name);
  const birth = docValue(formatDisplayDate(c.birthDate));
  const places = DOCUMENT_CHECKLIST.map((d) => [d.title, documentPlace(data, d.type)] as [string, string | null]);
  // People already named as emergency contacts above are not repeated.
  const named = [docValue(c.emergencyContact1.name), docValue(c.emergencyContact2.name)];
  const people = peopleContacts(data).filter((p) => !named.includes(p.name));
  return finish({
    id: "notfallinfo",
    title: "Notfallinformationen",
    status: "Ausführliche Informationen für Helfende. Kein rechtliches Dokument.",
    audience: "Für Angehörige und Helfende in den ersten Stunden",
    identity: identityOf(name, birth),
    keyMessage: EMERGENCY_CALL,
    editPath: "/dashboard/notfallkarte",
    missing: [!docValue(c.emergencyContact1.name) && "Erster Notfallkontakt"].filter(Boolean) as string[],
    warnings: emergencyWarnings(data),
    sections: [
      section("Wer ich bin", [rows([["Name", name], ["Geburtsdatum", birth], ["Sprache", languageOf(c)]])], { icon: "person" }),
      section("Im Notfall bitte anrufen", [
        contacts([emergencyContact(c.emergencyContact1, "Erster Notfallkontakt"), emergencyContact(c.emergencyContact2, "Zweiter Notfallkontakt"), textContact(c.familyDoctor, "Hausarztpraxis")]),
      ], { icon: "phone" }),
      section("Weitere Angehörige", [people.length ? { kind: "contacts", items: people } : null], { icon: "people" }),
      healthSection(data, options),
      section("Wo die Dokumente liegen", [rows(places)], { icon: "documents" }),
      section("Im Todesfall bitte informieren", [
        contacts([textContact(docValue(c.mosqueImam) ?? data.janazahWishes.preferredMosque, "Moschee oder Imam"), textContact(docValue(c.preferredFuneralDirector) ?? data.janazahWishes.preferredFuneralDirector, "Bestatter")]),
      ], { icon: "mosque" }),
    ],
  });
}

/** Sections of the Janazah wishes that hold the person's own entries. */
function janazahOwnSections(data: AmanahOrdnerData): (DocSection | null)[] {
  const j = data.janazahWishes;
  const g = data.ghuslKafan;
  const b = data.burialPreference;
  return [
    section("Das Wichtigste zuerst", [rows([["Name", docValue(j.fullName)], ["Islamische Bestattung gewünscht", docValue(j.islamicBurialDesired)], ["Ohne unnötige Verzögerung", docValue(j.noUnnecessaryDelay)], ["Region", docValue(j.locationRegion)]])], { icon: "info" }),
    section("Wen die Familie ansprechen soll", [
      contacts([textContact(j.trustedContact, "Vertrauensperson für die Janazah"), textContact(j.preferredMosque || j.mosqueCommunity, "Moschee oder Gemeinde"), textContact(j.preferredFuneralDirector, "Bestatter"), textContact(b.contactPerson, "Ansprechperson für die Beisetzung")]),
      rows([["Bitte informieren", docValue(j.peopleToNotify)], ["Weitere Kontakte", docValue(j.additionalContacts)]]),
    ], { icon: "people" }),
    section("Ghusl und Kafan", [
      rows([["Ghusl", docValue(j.ghusl)], ["Bevorzugte Personen", docValue(j.preferredGhuslPersons) ?? docValue(g.preferredGhuslTeam)], ["Wünsche zu Frauen und Männern", docValue(j.genderSpecificWishes)], ["Wer anwesend sein darf", docValue(g.whoMayBePresent)], ["Würde und Privatsphäre", docValue(g.dignityBoundaries)], ["Kafan", docValue(j.kafan)], ["Abschied der Familie", enumValue(g.familyFarewell, YES_NO_UNSURE)], ["Bedingungen", docValue(g.familyFarewellConditions)]]),
    ], { icon: "water" }),
    section("Janazah-Gebet", [rows([["Wunsch zum Gebet", docValue(j.janazahPrayer)], ["Moschee", docValue(j.preferredMosque)], ["Dabei sein sollen", docValue(j.peopleToInclude)]])], { icon: "prayer" }),
    section("Bestattung oder Überführung", [
      rows([["Beisetzung in Deutschland", docValue(j.burialGermany)], ["Überführung", enumValue(j.repatriation, YES_NO_UNSURE)], ["Friedhof", docValue(j.preferredCemetery)], ["Muslimisches Gräberfeld", docValue(j.muslimGraveyard)], ["Familiengrab", docValue(j.familyGrave)], ["Ort / PLZ", docValue(b.cityPlz)], ["Hinweise zum Land", docValue(j.burialCountryNotes)], ["Hinweise zur Überführung", docValue(j.repatriationNotes)], ["Unterlagen", docValue(j.documentNotes)]]),
    ], { icon: "place" }),
    section("Persönliche Wünsche und Nachricht", [
      docValue(j.messageToFamily) ? { kind: "text", text: j.messageToFamily.trim() } : null,
      rows([["Nicht gewünschte Bräuche", docValue(j.culturalExclusions)], ["Spendenwünsche", docValue(j.donationWishes)], ["Weitere Wünsche", docValue(j.additionalWishes)]]),
    ], { icon: "message" }),
  ];
}

function janazahSteps(data: AmanahOrdnerData): DocSection | null {
  const j = data.janazahWishes;
  const c = data.emergencyCard;
  const funeral = docValue(j.preferredFuneralDirector) ?? docValue(c.preferredFuneralDirector);
  const mosque = docValue(j.preferredMosque) ?? docValue(j.mosqueCommunity) ?? docValue(c.mosqueImam);
  const items: { title: string; detail?: string }[] = [];
  if (docValue(j.trustedContact)) items.push({ title: `Vertrauensperson informieren: ${j.trustedContact.trim()}`, detail: "Sie kennt diese Wünsche und kann die nächsten Schritte abstimmen." });
  items.push(funeral ? { title: `Bestatter anrufen: ${funeral}`, detail: "Der Bestatter hilft in der Regel bei Fristen und Unterlagen." } : { title: "Einen Bestatter anrufen, der islamische Bestattungen begleitet", detail: "Der Bestatter hilft in der Regel bei Fristen und Unterlagen." });
  items.push(mosque ? { title: `Moschee informieren: ${mosque}`, detail: "Waschung und Janazah-Gebet absprechen." } : { title: "Eine Moschee oder Gemeinde informieren", detail: "Waschung und Janazah-Gebet absprechen." });
  if (j.repatriation === "yes") items.push({ title: "Überführung ansprechen", detail: [docValue(j.repatriationNotes), docValue(j.burialCountryNotes)].filter(Boolean).join(" · ") || "Der Bestatter kennt Ablauf und Unterlagen." });
  if (docValue(j.peopleToNotify)) items.push({ title: "Diese Menschen benachrichtigen", detail: j.peopleToNotify.trim() });
  return { title: "Nächste Schritte für die Familie", icon: "steps", note: "Eine Orientierung aus meinen Angaben. Fristen und Formalitäten klärt der Bestatter.", blocks: [{ kind: "steps", items }] };
}

function janazahOpen(data: AmanahOrdnerData): DocSection | null {
  const j = data.janazahWishes;
  const g = data.ghuslKafan;
  const items: { title: string; detail?: string }[] = [];
  if (j.islamicBurialDesired === null) items.push({ title: "Ob eine islamische Bestattung gewünscht ist, steht noch nicht fest." });
  if (j.repatriation === "unsure") items.push({ title: "Ob eine Überführung gewünscht ist, ist noch offen." });
  if (g.familyFarewell === "") items.push({ title: "Ob die Familie Abschied nehmen kann, ist noch nicht festgelegt." });
  if (!docValue(j.preferredFuneralDirector) && !docValue(j.preferredMosque)) items.push({ title: "Weder Bestatter noch Moschee sind eingetragen." });
  if (docValue(j.obligationsNotes)) items.push({ title: "Verpflichtungen", detail: j.obligationsNotes.trim() });
  if (docValue(j.debtsAmanahNotes)) items.push({ title: "Schulden und Anvertrautes", detail: j.debtsAmanahNotes.trim() });
  return {
    title: "Offen und zu klären",
    icon: "question",
    blocks: [
      ...(items.length ? [{ kind: "list", items } as DocBlock] : []),
      { kind: "callout", tone: "info", text: "Religiöse Einzelfragen klärt ein Imam oder Gelehrte. Diese Wünsche sind keine rechtliche Verfügung." },
    ],
  };
}

/** Personal wishes for washing, prayer and burial, with the people to call and the next steps. */
export function buildJanazah(data: AmanahOrdnerData): DocModel {
  const j = data.janazahWishes;
  return finish({
    id: "janazah",
    title: "Janazah-Wünsche",
    status: "Persönliche Wünsche für die Familie. Keine rechtliche Verfügung.",
    audience: "Für meine Familie und die Menschen, die die Janazah begleiten",
    identity: identityOf(docValue(j.fullName) ?? docValue(data.emergencyCard.name), docValue(formatDisplayDate(j.birthDate)) ?? docValue(j.birthDate)),
    editPath: "/dashboard/janazah",
    missing: [j.islamicBurialDesired === null && "Ob eine islamische Bestattung gewünscht ist", !docValue(j.preferredFuneralDirector) && !docValue(j.preferredMosque) && "Bestatter oder Moschee"].filter(Boolean) as string[],
    warnings: data.emergencyCard.hasJanazahWishes === false && j.islamicBurialDesired !== null ? ["Notfallkarte sagt „keine Janazah-Wünsche“, es sind aber Wünsche eingetragen."] : [],
    sections: janazahOwnSections(data),
    derived: [janazahSteps(data), janazahOpen(data)],
  });
}

function erbprofilSections(data: AmanahOrdnerData): (DocSection | null)[] {
  const p = data.inheritanceProfile;
  const touched = p.married !== null || p.sons > 0 || p.daughters > 0 || p.parentsAlive !== null;
  const points = inheritanceConversationPoints(p);
  const pointList: DocBlock | null = points.length ? { kind: "list", items: points.map((title) => ({ title })) } : null;
  return [
    section("Familie", [
      rows([["Verheiratet", docValue(p.married)], ["Ehepartner lebt", docValue(p.spouseAlive)], ["Söhne", touched ? docValue(p.sons) : null], ["Töchter", touched ? docValue(p.daughters) : null], ["Eltern leben", docValue(p.parentsAlive)], ["Geschwister", docValue(p.siblings)], ["Stiefkinder", docValue(p.stepchildren)], ["Pflegekinder", docValue(p.fosterChildren)], ["Nicht-muslimische Angehörige", docValue(p.nonMuslimRelatives)]]),
    ], { icon: "people" }),
    section("Vermögen", [rows([["Immobilien", docValue(p.realEstate)], ["Firma / GmbH", docValue(p.companyGmbH)], ["Eigentum im Ausland", docValue(p.foreignProperty)], ["Vermögen grob", docValue(p.approximateWealth)], ["Schulden", docValue(p.debts)]])], { icon: "wallet" }),
    section("Notizen (unverbindlich)", [rows([["Notizen zur Waṣiyya", docValue(p.desiredWasiyyah)], ["Notizen zur Sadaqa Jariya", docValue(p.desiredSadaqaJariya)]])], { icon: "book" }),
    section("Fragen für das Gespräch", [pointList, rows([["An den Imam", docValue(p.openQuestionsImam)], ["An Anwalt oder Notar", docValue(p.openQuestionsLawyer)]])], { icon: "question" }),
  ];
}

/** Facts and questions for the talk with scholars, lawyer or notary. Never a will, never shares. */
export function buildErbprofil(data: AmanahOrdnerData): DocModel {
  const p = data.inheritanceProfile;
  return finish({
    id: "erbprofil",
    title: "Erbprofil für das Gespräch",
    status: `Kein Testament. Es berechnet keine Anteile. ${moduleText("testament-form-pdf")}`,
    audience: "Für das Gespräch mit Gelehrten, Anwalt oder Notar",
    identity: identityOf(docValue(data.emergencyCard.name), null),
    editPath: "/dashboard/testament",
    missing: [p.married === null && "Familienstand", p.parentsAlive === null && "Ob die Eltern leben"].filter(Boolean) as string[],
    warnings: p.married === false && p.spouseAlive === true ? ["„Nicht verheiratet“ und „Ehepartner lebt“ widersprechen sich."] : [],
    sections: erbprofilSections(data),
  });
}

export function buildFamilienbrief(data: AmanahOrdnerData): DocModel {
  const f = data.familyMessage;
  return finish({
    id: "familienbrief",
    title: "Brief an meine Familie",
    status: "Persönliche Worte. Kein rechtliches Dokument.",
    audience: "Für meine Familie",
    editPath: "/dashboard/familie",
    missing: docValue(f.familyLetter) ? [] : ["Der Brief selbst"],
    warnings: [],
    sections: [
      section("Brief", [docValue(f.familyLetter) ? { kind: "text", text: f.familyLetter.trim() } : null], { icon: "message" }),
      section("Das Wichtigste in Kürze", [docValue(f.keyWishesSummary) ? { kind: "text", text: f.keyWishesSummary.trim() } : null], { icon: "info" }),
    ],
  });
}

const PRIORITY: Record<string, string> = { high: "hoch", medium: "mittel", low: "niedrig" };

function debtGroups(data: AmanahOrdnerData): [string, DocBlock][] {
  const groups = new Map<string, { title: string; detail?: string }[]>();
  for (const d of data.debtsAmanah) {
    const key = debtTypeLabels[d.type] ?? "Sonstiges";
    const list = groups.get(key) ?? [];
    list.push({ title: d.description, detail: [d.person && `Person/Stelle: ${d.person}`, `Priorität: ${PRIORITY[d.priority] ?? d.priority}`].filter(Boolean).join(" · ") });
    groups.set(key, list);
  }
  return [...groups.entries()].map(([title, items]) => [title, { kind: "list", items }]);
}

export function buildSchulden(data: AmanahOrdnerData): DocModel {
  return finish({
    id: "schulden",
    title: "Schulden und Amanah",
    status: "Übersicht für die Familie. Keine rechtliche Prüfung.",
    audience: "Für meine Familie: was offen ist und was mir anvertraut wurde",
    editPath: "/dashboard/schulden-amanah",
    missing: data.debtsAmanah.length ? [] : ["Noch keine Einträge"],
    warnings: [],
    sections: debtGroups(data).map(([title, block]) => section(title, [block], { icon: "wallet" })),
  });
}

export const ASSET_DOC_NOTICE =
  "Kein Testament. Reine Bestandsaufnahme: Sie regelt nicht, wer etwas erhält. Beträge und Notizen werden nicht gedruckt.";

const assetList = (data: AmanahOrdnerData): DocBlock | null =>
  data.assets.length
    ? {
        kind: "list",
        items: data.assets.map((a) => ({
          title: `${ASSET_TYPES[a.type]}: ${a.description}`,
          detail: [a.locationHint && `Unterlagen: ${a.locationHint}`, a.mortgage && `Hypothek oder Kredit: ${MORTGAGE[a.mortgage]}`, a.ownership && `Eigentum: ${OWNERSHIP[a.ownership]}`].filter(Boolean).join(" · ") || undefined,
        })),
      }
    : null;

const digitalList = (data: AmanahOrdnerData): DocBlock | null =>
  data.digitalLegacy.length ? { kind: "list", items: data.digitalLegacy.map((d) => ({ title: `${digitalTypeLabels[d.type] ?? "Konto"}: ${d.description}`, detail: d.locationHint ? `Hinweis: ${d.locationHint}` : undefined })) } : null;

/** What exists and where the papers are. Amounts and free notes are deliberately left out. */
export function buildVermoegen(data: AmanahOrdnerData): DocModel {
  return finish({
    id: "vermoegen",
    title: "Vermögensübersicht",
    status: ASSET_DOC_NOTICE,
    audience: "Für meine Familie: was es gibt und wo die Unterlagen liegen",
    editPath: "/dashboard/vermoegen",
    missing: data.assets.length ? [] : ["Noch keine Einträge"],
    warnings: [],
    sections: [section("Vermögenswerte", [assetList(data)], { icon: "wallet" }), section("Digitaler Nachlass (ohne Passwörter)", [digitalList(data)], { icon: "digital" })],
  });
}

/**
 * "What should my family do?" Concrete people, places and next steps from the person's own entries,
 * ordered by time. General steps only; no individual legal advice.
 */
export function buildLeitfaden(data: AmanahOrdnerData): DocModel {
  const c = data.emergencyCard;
  const j = data.janazahWishes;
  const trusted = peopleContacts(data, ["vertrauensperson"]);
  const places = DOCUMENT_CHECKLIST.map((d) => [d.title, documentPlace(data, d.type)] as [string, string | null]);
  const hasPeople = Boolean(docValue(c.emergencyContact1.name) || trusted.length);
  const funeral = docValue(j.preferredFuneralDirector) ?? docValue(c.preferredFuneralDirector);
  const mosque = docValue(j.preferredMosque) ?? docValue(c.mosqueImam);
  return finish({
    id: "leitfaden",
    title: "Was soll meine Familie im Notfall tun?",
    status: "Ein Leitfaden mit meinen Angaben. Keine Rechtsberatung.",
    audience: "Für meine Familie und meine Vertrauenspersonen",
    identity: identityOf(docValue(c.name), docValue(formatDisplayDate(c.birthDate))),
    keyMessage: hasPeople ? "Bei Lebensgefahr: Notruf 112. Danach die Menschen in Schritt 1 anrufen." : undefined,
    editPath: "/dashboard/vorsorge",
    missing: [!docValue(c.emergencyContact1.name) && "Erster Notfallkontakt", !places.some(([, v]) => v) && "Ablageorte der Dokumente"].filter(Boolean) as string[],
    warnings: emergencyWarnings(data),
    sections: [
      hasPeople
        ? section("Sofort: anrufen", [
            { kind: "steps", items: [{ title: "Bei Lebensgefahr: Notruf 112." }, { title: "Danach die Kontakte unten anrufen, in dieser Reihenfolge." }] },
            contacts([emergencyContact(c.emergencyContact1, "Zuerst anrufen"), emergencyContact(c.emergencyContact2, "Danach"), textContact(c.familyDoctor, "Hausarztpraxis")]),
          ], { icon: "phone" })
        : null,
      section("Wer meine Wünsche kennt", [
        trusted.length ? { kind: "contacts", items: trusted } : null,
        rows([["Vorgesehen für die Vollmacht", docValue(data.powerOfAttorney.authorizedPerson)], ["Ersatzperson", docValue(data.powerOfAttorney.substitutePerson)]]),
      ], { icon: "people", note: "Die Nennung hier ist keine Vollmacht." }),
      section("Wo meine Unterlagen liegen", [rows(places)], { icon: "documents" }),
      section("Wer was übernommen hat", [
        (() => {
          // Agreed in a recorded family conversation; open tasks only. Not an authorisation.
          const tasks = (data.familyConversation?.talks ?? []).flatMap((t) => t.tasks).filter((k) => !k.done && (docValue(k.who) || docValue(k.what)));
          return tasks.length ? ({ kind: "steps", items: tasks.map((k) => ({ title: docValue(k.what) ?? "Aufgabe", detail: docValue(k.who) ? `Übernimmt: ${k.who.trim()}` : undefined })) } as DocBlock) : null;
        })(),
      ], { icon: "steps", note: "So haben wir es im Familiengespräch abgesprochen. Das ist keine Vollmacht." }),
      section("Im Todesfall", [
        contacts([textContact(funeral ?? undefined, "Bestatter"), textContact(mosque ?? undefined, "Moschee oder Imam"), textContact(j.trustedContact, "Vertrauensperson für die Janazah")]),
        j.islamicBurialDesired !== null ? { kind: "steps", items: [{ title: "Meine Wünsche zu Waschung, Gebet und Beisetzung lesen", detail: "Sie stehen im Dokument „Janazah-Wünsche“." }] } : null,
      ], { icon: "mosque" }),
    ],
    derived: [
      {
        title: "In den Wochen danach",
        icon: "steps",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Unterlagen sammeln", detail: "Die Ablageorte stehen oben." },
              { title: "Offene Schulden und Anvertrautes (Amanah) klären", detail: data.debtsAmanah.length ? "Eine Liste steht im Dokument „Schulden und Amanah“." : undefined },
              { title: "Erbe und Formalitäten", detail: "Anwalt, Notar oder das Nachlassgericht helfen; religiöse Fragen klären ein Imam oder Gelehrte." },
            ],
          },
        ],
      },
      { title: "Was dieser Leitfaden nicht ist", icon: "info", blocks: [{ kind: "callout", tone: "info", text: "Er ersetzt keine Vollmacht, kein Testament und keine Beratung." }] },
    ],
  });
}

export const FULL_DOC_NOTICE = "Persönliche Übersicht: kein Testament, keine Vollmacht, keine Patientenverfügung";

/**
 * The complete folder for looking things up: cover, contents and ten parts. Every part that touches
 * a legal document says in its heading what it is not.
 */
export function buildGesamt(data: AmanahOrdnerData, options: DocOptions = {}): DocModel {
  const c = data.emergencyCard;
  const m = data.medicalWishes;
  const v = data.powerOfAttorney;
  const care = data.careDirective;
  const name = docValue(c.name) ?? docValue(data.userProfile?.name);
  const birth = docValue(formatDisplayDate(c.birthDate));
  const parts = [buildNotfallinfo(data, options), buildJanazah(data), buildErbprofil(data), buildSchulden(data), buildVermoegen(data), buildFamilienbrief(data)];
  const places = DOCUMENT_CHECKLIST.map((d) => [d.title, documentPlace(data, d.type)] as [string, string | null]);
  const emergencyPeople = peopleContacts(data, ["notfallkontakt", "vertrauensperson"]).filter((p) => p.name !== docValue(c.emergencyContact1.name) && p.name !== docValue(c.emergencyContact2.name));
  const janazahBlocks = janazahOwnSections(data)
    .filter((s): s is DocSection => s !== null)
    .flatMap((s) => grouped([[s.title, s.blocks]]));
  const erbBlocks = erbprofilSections(data)
    .filter((s): s is DocSection => s !== null)
    .flatMap((s) => grouped([[`Erbprofil (kein Testament): ${s.title}`, s.blocks]]));
  const legal = legalDocumentStates(data);
  const funeral = docValue(data.janazahWishes.preferredFuneralDirector) ?? docValue(c.preferredFuneralDirector);

  return finish({
    id: "gesamt",
    title: "Vorsorge-Übersicht",
    status: `Kein Testament, keine Vollmacht, keine Patientenverfügung, keine Betreuungsverfügung. Sammelt deine Angaben zum Nachschlagen. ${moduleText("testament-form-print")} ${moduleText("vorsorge-documents-print")}`,
    audience: "Für meine Familie und meine Vertrauenspersonen",
    identity: identityOf(name, birth),
    pageNotice: FULL_DOC_NOTICE,
    cover: true,
    editPath: "/dashboard",
    missing: parts.flatMap((p) => (p.hasContent ? [] : [`${p.title}: noch keine Angaben`])),
    warnings: [...new Set(parts.flatMap((p) => p.warnings))],
    sections: [
      section("Persönliche Übersicht", [rows([["Name", name], ["Geburtsdatum", birth], ["Sprache", languageOf(c)], ["Region", docValue(data.janazahWishes.locationRegion)]])], { icon: "person" }),
      section("Notfallkontakte", [
        contacts([emergencyContact(c.emergencyContact1, "Erster Notfallkontakt"), emergencyContact(c.emergencyContact2, "Zweiter Notfallkontakt"), textContact(c.familyDoctor, "Hausarztpraxis"), ...emergencyPeople]),
      ], { icon: "phone" }),
      section("Medizinische Informationen", [
        healthRows(data, options),
        options.includeHealth ? null : docValue(c.allergies) || docValue(c.medications) || docValue(c.illnesses) ? { kind: "callout", tone: "info", text: "Gesundheitsangaben sind in diesem Ausdruck bewusst nicht enthalten." } : null,
        ...grouped([["Wünsche zur medizinischen Behandlung (keine Patientenverfügung)", [rows([["Medizinische Wünsche", docValue(m.medicalWishes)], ["Religiöse Wünsche", docValue(m.religiousWishes)], ["Imam / Seelsorge", docValue(m.imamSeelsorge)], ["Würde und Grenzen", docValue(m.dignityBoundaries)], ["Wer mit Ärzten sprechen soll", docValue(m.whoSpeaksToDoctors)], ["Wo die Patientenverfügung liegt", docValue(m.documentLocation)]])]]]),
      ], { icon: "health" }),
      section("Dokumente und Aufbewahrungsorte", [rows(places)], { icon: "documents", note: "Wo die Originale liegen. Die Angabe hier ersetzt kein Dokument." }),
      section("Vollmacht und Betreuung: meine Angaben", grouped([
        ["Angaben zur Vollmacht (keine Vollmacht)", [rows([["Vorgesehene Person", docValue(v.authorizedPerson)], ["Ersatzperson", docValue(v.substitutePerson)], ["Wer nicht entscheiden soll", docValue(v.excludedPersons)]])]],
        ["Wünsche zur Betreuung (keine Betreuungsverfügung)", [rows([["Gewünschter Betreuer", docValue(care.preferredGuardian)], ["Nicht gewünscht", docValue(care.excludedGuardian)], ["Wünsche zu Pflege und Wohnen", docValue(care.careHousingWishes)]])]],
      ]), { icon: "legal", note: "Die Nennung einer Person ist keine Vollmacht." }),
      section("Janazah-Wünsche", janazahBlocks, { icon: "mosque", note: "Persönliche Wünsche, keine rechtliche Verfügung." }),
      section("Vermögen, Schulden und digitaler Nachlass", [
        ...grouped([
          ["Vermögen (Bestandsaufnahme, kein Testament)", [assetList(data)]],
          ...debtGroups(data).map(([title, block]) => [`Schulden und Amanah: ${title}`, [block]] as [string, DocBlock[]]),
          ["Digitaler Nachlass (ohne Passwörter)", [digitalList(data)]],
        ]),
        ...erbBlocks,
      ], { icon: "wallet", note: "Beträge und Passwörter werden nicht gedruckt." }),
      section("Persönliche Worte an die Familie", parts[5].sections.flatMap((s) => grouped([[s.title, s.blocks]])), { icon: "message" }),
    ],
    derived: [
      {
        title: "Rechtlich noch zu klären",
        icon: "legal",
        note: "Diese Dokumente wirken nur in ihrer eigenen rechtlichen Form. Amanah hält nur fest, ob es sie gibt und wo sie liegen.",
        blocks: [
          { kind: "list", items: legal.map((l) => ({ title: `${l.title}: ${l.label}`, detail: [l.location && `Ort: ${l.location}`, `Ansprechpartner: ${l.who}`].filter(Boolean).join(" · ") })) },
          { kind: "callout", tone: "info", text: `${moduleText("testament-form-print")} ${moduleText("vorsorge-documents-print")}` },
        ],
      },
      {
        title: "Aufgaben für die Familie",
        icon: "steps",
        blocks: [
          {
            kind: "steps",
            items: [
              { title: "Bei Lebensgefahr: Notruf 112", detail: docValue(c.emergencyContact1.name) ? `Danach ${contactLine(c.emergencyContact1)} anrufen.` : undefined },
              { title: "Unterlagen holen", detail: "Die Orte stehen im Teil „Dokumente und Aufbewahrungsorte“." },
              { title: "Im Todesfall: Bestatter und Moschee informieren", detail: [funeral && `Bestatter: ${funeral}`, "Die Wünsche stehen im Teil „Janazah-Wünsche“."].filter(Boolean).join(" · ") },
              { title: "Offene Schulden und Anvertrautes (Amanah) klären", detail: data.debtsAmanah.length ? "Die Liste steht im Teil „Vermögen, Schulden und digitaler Nachlass“." : undefined },
              { title: "Erbe und Formalitäten", detail: "Anwalt, Notar oder Nachlassgericht helfen; religiöse Fragen klären ein Imam oder Gelehrte." },
            ],
          },
        ],
      },
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
  { id: "notfallkarte", title: "Notfallkarte", description: "Ein A4-Notfallblatt und eine Faltkarte fürs Portemonnaie.", build: buildNotfallkarte, health: true },
  { id: "notfallinfo", title: "Notfallinformationen", description: "Ausführlich für Helfende: Kontakte, Ärzte, Ablageorte.", build: buildNotfallinfo, health: true },
  { id: "leitfaden", title: "Leitfaden für die Familie", description: "Was im Notfall zu tun ist: wen anrufen, wo die Unterlagen liegen.", build: buildLeitfaden },
  { id: "gesamt", title: "Vorsorge-Übersicht", description: "Alle Angaben mit Deckblatt und Inhalt. Kein Testament, keine Vollmacht.", build: buildGesamt, health: true },
  { id: "janazah", title: "Janazah-Wünsche", description: "Wünsche, Ansprechpartner und nächste Schritte für die Familie.", build: buildJanazah },
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
