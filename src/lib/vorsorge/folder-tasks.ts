import type { AmanahOrdnerData, VorsorgeAreaId } from "@/lib/domain/types";
import { REVIEW_AFTER_DAYS, getAllAreaStates } from "@/lib/vorsorge/areas";
import { legalDocumentStates } from "@/lib/vorsorge/handover";
import { DOCUMENTS, type DocumentId } from "@/lib/documents/model";

/**
 * "Meine Dokumente": what is still open in the folder, and when each printout's details last changed.
 * Everything is derived from the person's own entries; nothing here is stored or sent anywhere.
 * A task names a next step and where to do it; it never says that something is legally valid.
 */
export type FolderTaskKind = "bereich" | "dokument" | "widerspruch" | "aktualitaet" | "ueberpruefung";

export interface FolderTask {
  id: string;
  kind: FolderTaskKind;
  title: string;
  detail?: string;
  path: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Which areas' changes make a printout outdated. */
export const DOCUMENT_AREAS: Record<DocumentId, VorsorgeAreaId[]> = {
  notfallkarte: ["notfall", "dokumente"],
  notfallinfo: ["notfall", "familie", "dokumente"],
  leitfaden: ["notfall", "familie", "dokumente", "janazah"],
  gesamt: ["notfall", "familie", "gesundheit", "janazah", "dokumente", "vermoegen"],
  janazah: ["janazah"],
  erbprofil: ["vermoegen"],
  familienbrief: ["familie"],
  schulden: ["vermoegen"],
  vermoegen: ["vermoegen"],
};

/** Latest change in the areas a printout draws from; null when nothing was recorded. */
export function documentUpdatedAt(data: AmanahOrdnerData, id: DocumentId): string | null {
  const times = DOCUMENT_AREAS[id].map((a) => data.vorsorgeMeta?.areaUpdatedAt?.[a]).filter((t): t is string => Boolean(t) && !Number.isNaN(Date.parse(t!)));
  if (!times.length) return null;
  return times.reduce((a, b) => (Date.parse(a) >= Date.parse(b) ? a : b));
}

export function folderTasks(data: AmanahOrdnerData, now: Date = new Date()): FolderTask[] {
  const tasks: FolderTask[] = [];
  for (const state of getAllAreaStates(data, now)) {
    const path = state.area.pages[0].path;
    for (const reason of state.reviewReasons) {
      tasks.push({ id: `pruefen-${state.area.id}-${tasks.length}`, kind: reason.startsWith("Seit über einem Jahr") ? "aktualitaet" : "widerspruch", title: `${state.area.title}: bitte prüfen`, detail: reason, path });
    }
    if (state.status === "nicht_begonnen") tasks.push({ id: `bereich-${state.area.id}`, kind: "bereich", title: `${state.area.title}: noch nicht begonnen`, detail: state.area.description, path });
    else if (state.missing.length) tasks.push({ id: `bereich-${state.area.id}`, kind: "bereich", title: `${state.area.title}: noch offen`, detail: state.missing.join(" · "), path });
  }
  for (const doc of legalDocumentStates(data)) {
    if (doc.status === "dokument_hinterlegt") continue;
    const detail =
      doc.status === "nicht_angegeben"
        ? `Noch nicht angegeben, ob es sie gibt. Erstellen und beraten: ${doc.who}.`
        : `${doc.label}. Erstellen und beraten: ${doc.who}.`;
    tasks.push({ id: `dokument-${doc.title}`, kind: "dokument", title: doc.title, detail, path: "/dashboard/dokumente" });
  }
  const reviewed = data.vorsorgeMeta?.reviewedAt;
  const anyContent = getAllAreaStates(data, now).some((s) => s.status !== "nicht_begonnen");
  if (anyContent && (!reviewed || now.getTime() - Date.parse(reviewed) > REVIEW_AFTER_DAYS * DAY_MS)) {
    tasks.push({
      id: "ueberpruefung",
      kind: "ueberpruefung",
      title: reviewed ? "Angaben seit über einem Jahr nicht überprüft" : "Angaben noch nie als überprüft bestätigt",
      detail: "Einmal im Jahr und nach Umzug, Heirat, Geburt oder Krankheit alles durchsehen.",
      path: "/dashboard/vorsorge/abschluss",
    });
  }
  // Duplicates by id would confuse screen readers and React keys.
  return tasks.filter((t, i) => tasks.findIndex((x) => x.id === t.id) === i);
}

export interface PrintoutState {
  id: DocumentId;
  title: string;
  ready: boolean;
  missing: number;
  warnings: number;
  updatedAt: string | null;
}

export function printoutStates(data: AmanahOrdnerData): PrintoutState[] {
  return DOCUMENTS.map((doc) => {
    const model = doc.build(data);
    return { id: doc.id, title: doc.title, ready: model.hasContent, missing: model.missing.length, warnings: model.warnings.length, updatedAt: model.hasContent ? documentUpdatedAt(data, doc.id) : null };
  });
}
