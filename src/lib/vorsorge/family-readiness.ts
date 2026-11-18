import type { AmanahOrdnerData, DocumentType } from "@/lib/domain/types";
import { peopleToInform } from "@/lib/vorsorge/handover";

/**
 * What the recorded family conversations say: who was told, when, what is still open. Facts from the
 * person's own record. "Informed" means only that a talk was recorded; it grants nothing.
 */
export interface FamilyReadiness {
  talks: number;
  lastTalk: string | null;
  informed: string[];
  /** People the folder names as important who were not part of a recorded talk. */
  notYetTalkedTo: string[];
  openTasks: { who: string; what: string }[];
  documentsKnown: DocumentType[];
  storageExplained: "ja" | "teilweise" | "nein" | "unbekannt";
  openPoints: string[];
}

export function familyReadiness(data: AmanahOrdnerData): FamilyReadiness {
  const talks = data.familyConversation?.talks ?? [];
  const nameOf = new Map(data.familyMembers.map((m) => [m.id, m.name.trim()]));
  const informed = [...new Set(talks.flatMap((t) => [...t.personIds.map((id) => nameOf.get(id) ?? ""), ...t.otherPeople.split(/[,;]/).map((s) => s.trim())]).filter(Boolean))];
  const dates = talks.map((t) => t.date).filter((d) => !Number.isNaN(Date.parse(d))).sort();
  const explained = talks.map((t) => t.storageExplained);
  return {
    talks: talks.length,
    lastTalk: dates.at(-1) ?? null,
    informed,
    notYetTalkedTo: peopleToInform(data)
      .map((p) => p.name)
      .filter((name) => !informed.some((i) => i === name || name.startsWith(`${i} `) || i.startsWith(`${name} `))),
    openTasks: talks.flatMap((t) => t.tasks.filter((k) => !k.done && (k.who.trim() || k.what.trim())).map((k) => ({ who: k.who.trim(), what: k.what.trim() }))),
    documentsKnown: [...new Set(talks.flatMap((t) => t.documentsToKnow))],
    storageExplained: explained.includes("ja") ? "ja" : explained.includes("teilweise") ? "teilweise" : explained.includes("nein") ? "nein" : "unbekannt",
    openPoints: talks.map((t) => t.openPoints.trim()).filter(Boolean),
  };
}
