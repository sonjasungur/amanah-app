import type { AmanahOrdnerData, DocumentType, VorsorgeAreaId } from "@/lib/domain/types";
import { getAllAreaStates, type AreaState } from "@/lib/vorsorge/areas";
import { DOCUMENT_STATUS_LABELS } from "@/lib/vorsorge/documents";

/**
 * What happens after the details are entered. Statuses describe the person's own entries and the
 * documents they keep elsewhere; none of them says that anything is legally done.
 */
export type HandoverStatus =
  | "offen"
  | "in_bearbeitung"
  | "angaben_vollstaendig"
  | "fachpruefung_empfohlen"
  | "dokument_hinterlegt"
  | "freigegeben";

export const HANDOVER_LABELS: Record<HandoverStatus, string> = {
  offen: "Noch offen",
  in_bearbeitung: "In Bearbeitung",
  angaben_vollstaendig: "Persönliche Angaben vollständig",
  fachpruefung_empfohlen: "Fachliche Prüfung empfohlen",
  dokument_hinterlegt: "Dokument vorhanden und Aufbewahrungsort hinterlegt",
  freigegeben: "Für benannte Person freigegeben",
};

/** Who can check what the person prepared. Never a verdict, only whom to ask. */
const EXPERTS: Partial<Record<VorsorgeAreaId, string>> = {
  gesundheit: "Arzt sowie Anwalt oder Notar (Patientenverfügung, Vorsorgevollmacht)",
  janazah: "Imam oder Gelehrte für religiöse Fragen; Bestatter für Ablauf und Fristen",
  vermoegen: "Anwalt oder Notar für Erbe und Nachlass; Gelehrte für religiöse Fragen",
  dokumente: "Notar oder Nachlassgericht zur sicheren Verwahrung eines Testaments",
};

export interface AreaHandover {
  state: AreaState;
  statuses: HandoverStatus[];
  expert?: string;
}

export function areaHandover(state: AreaState): AreaHandover {
  const base: HandoverStatus =
    state.status === "nicht_begonnen" ? "offen" : state.status === "vollstaendig" ? "angaben_vollstaendig" : "in_bearbeitung";
  const statuses: HandoverStatus[] = [base];
  const expert = EXPERTS[state.area.id];
  if (base === "angaben_vollstaendig" && expert) statuses.push("fachpruefung_empfohlen");
  return { state, statuses, expert };
}

/** Documents that only have effect when made in their own legal form; Amanah only records where they are. */
export const LEGAL_DOCUMENTS: { type: DocumentType; title: string; who: string }[] = [
  { type: "patientenverfuegung", title: "Patientenverfügung", who: "Arzt, Anwalt oder Notar" },
  { type: "vorsorgevollmacht", title: "Vorsorgevollmacht", who: "Anwalt oder Notar" },
  { type: "betreuungsverfuegung", title: "Betreuungsverfügung", who: "Anwalt oder Notar" },
  { type: "testament", title: "Testament", who: "Anwalt oder Notar; Gelehrte für religiöse Fragen" },
];

export interface LegalDocumentState {
  title: string;
  who: string;
  status: HandoverStatus | "fehlt" | "nicht_angegeben";
  label: string;
  location?: string;
}

export function legalDocumentStates(data: AmanahOrdnerData): LegalDocumentState[] {
  return LEGAL_DOCUMENTS.map((doc) => {
    const entry = data.documents.find((d) => d.type === doc.type);
    const location = entry?.location?.trim() || undefined;
    if (entry?.status === "vorhanden" && location) {
      return { title: doc.title, who: doc.who, status: "dokument_hinterlegt" as const, label: HANDOVER_LABELS.dokument_hinterlegt, location };
    }
    if (entry?.status) return { title: doc.title, who: doc.who, status: "fehlt" as const, label: DOCUMENT_STATUS_LABELS[entry.status] + (entry.status === "vorhanden" ? " – Aufbewahrungsort fehlt" : ""), location };
    return { title: doc.title, who: doc.who, status: "nicht_angegeben" as const, label: "Nicht angegeben" };
  });
}

/**
 * People to tell where things are: trusted people, the person meant for the power of attorney,
 * the Janazah contact and the emergency contacts. Each name once, with the most important reason.
 */
export function peopleToInform(data: AmanahOrdnerData): { name: string; why: string }[] {
  const out = new Map<string, string>();
  const add = (name: string | undefined, why: string) => {
    const n = name?.trim();
    if (n && !out.has(n)) out.set(n, why);
  };
  for (const m of data.familyMembers) if (m.roles?.includes("vertrauensperson")) add(m.name, "Vertrauensperson: sollte wissen, wo Originale und Notfallpaket liegen.");
  add(data.powerOfAttorney.authorizedPerson, "Für die Vollmacht vorgesehen: sollte wissen, wo die Vorsorgevollmacht liegt.");
  add(data.janazahWishes.trustedContact, "Vertrauensperson für die Janazah: sollte deine Wünsche kennen.");
  for (const m of data.familyMembers) if (m.roles?.includes("notfallkontakt")) add(m.name, "Notfallkontakt: sollte die Notfallkarte kennen.");
  add(data.emergencyCard.emergencyContact1.name, "Notfallkontakt: sollte die Notfallkarte kennen.");
  add(data.emergencyCard.emergencyContact2.name, "Notfallkontakt: sollte die Notfallkarte kennen.");
  return [...out.entries()].map(([name, why]) => ({ name, why }));
}

export interface HandoverSummary {
  areas: AreaHandover[];
  legal: LegalDocumentState[];
  people: { name: string; why: string }[];
  reviewedAt: string | null;
  allComplete: boolean;
}

export function handoverSummary(data: AmanahOrdnerData, now: Date = new Date()): HandoverSummary {
  const areas = getAllAreaStates(data, now).map(areaHandover);
  return {
    areas,
    legal: legalDocumentStates(data),
    people: peopleToInform(data),
    reviewedAt: data.vorsorgeMeta.reviewedAt ?? null,
    allComplete: areas.every((a) => a.state.status === "vollstaendig"),
  };
}
