import { moduleText } from "@/lib/content/module-texts";
import type { DocumentEntry, DocumentStatus, DocumentType } from "@/lib/domain/types";

/** Typical documents a family needs to find. The app stores locations, never files. */
export const DOCUMENT_CHECKLIST: { type: DocumentType; title: string; hint: string }[] = [
  { type: "patientenverfuegung", title: "Patientenverfügung", hint: "Original und wer eine Kopie hat" },
  { type: "vorsorgevollmacht", title: "Vorsorgevollmacht", hint: moduleText("doc-vollmacht") },
  { type: "betreuungsverfuegung", title: "Betreuungsverfügung", hint: "" },
  { type: "testament", title: "Testament", hint: moduleText("doc-testament") },
  { type: "ausweis", title: "Personalausweis / Reisepass", hint: moduleText("doc-ausweis") },
  { type: "versicherung", title: "Versicherungen", hint: "Lebens-, Sterbegeld-, Unfallversicherung" },
  { type: "bank", title: "Bankunterlagen", hint: "Konten, Daueraufträge, Vollmachten" },
  { type: "grundbuch", title: "Grundbuch / Immobilien", hint: "" },
  { type: "bestattungsvorsorge", title: "Bestattungsvorsorge", hint: "Vertrag mit Bestatter, Grabstelle" },
  { type: "organspende", title: "Organspendeausweis / Erklärung", hint: "" },
];

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  vorhanden: "Vorhanden",
  fehlt: "Fehlt noch",
  pruefen: "Prüfen / aktualisieren",
};

/** Upserts the checklist entry of `type`; keeps all other entries untouched. */
export function upsertDocument(documents: DocumentEntry[], type: DocumentType, patch: Partial<DocumentEntry>): DocumentEntry[] {
  const existing = documents.find((d) => d.type === type && type !== "other");
  if (existing) return documents.map((d) => (d === existing ? { ...d, ...patch } : d));
  const title = DOCUMENT_CHECKLIST.find((c) => c.type === type)?.title ?? "Dokument";
  return [...documents, { id: crypto.randomUUID(), type, title, location: "", ...patch }];
}

export function documentSummary(documents: DocumentEntry[]): { total: number; available: number; missing: number; review: number } {
  const byType = DOCUMENT_CHECKLIST.map((c) => documents.find((d) => d.type === c.type)?.status);
  return {
    total: DOCUMENT_CHECKLIST.length,
    available: byType.filter((s) => s === "vorhanden").length,
    missing: byType.filter((s) => s === "fehlt").length,
    review: byType.filter((s) => s === "pruefen").length,
  };
}
