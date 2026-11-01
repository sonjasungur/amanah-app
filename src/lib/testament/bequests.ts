import type { BequestWish, YesNoUnsure } from "@/lib/domain/types";

export const BEQUEST_KINDS: Record<BequestWish["kind"], string> = {
  amount: "Geldbetrag",
  percent: "Anteil in Prozent",
  item: "Gegenstand",
};

const TEXT_LIMIT = 300;

export interface BequestDraft {
  kind: BequestWish["kind"];
  /** As typed, e.g. "5.000,50". */
  value: string;
  item: string;
  beneficiary: string;
  beneficiaryKind: BequestWish["beneficiaryKind"];
  alsoHeir: YesNoUnsure;
  note: string;
}

/** Reads numbers as typed in Germany: "5.000,50" or "12,5"; "12.5" is also understood. */
export function parseGermanNumber(text: string): number | null {
  const t = text.replace(/\s|€|%/g, "");
  if (!/^(\d{1,3}(\.\d{3})+|\d+)(,\d+)?$|^\d+\.\d{1,2}$/.test(t)) return null;
  const n = Number(/^\d+\.\d{1,2}$/.test(t) ? t : t.replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

/** Checks the input only. Passing says nothing about whether a wish could be legally effective. */
export function validateBequestDraft(draft: BequestDraft): string[] {
  const errors: string[] = [];
  if (!draft.beneficiary.trim()) errors.push("Bitte gib an, wer etwas erhalten soll.");
  if (draft.kind === "item" && !draft.item.trim()) errors.push("Bitte beschreibe den Gegenstand.");
  if (draft.kind !== "item") {
    const n = parseGermanNumber(draft.value);
    if (n === null || n <= 0) errors.push(draft.kind === "amount" ? "Bitte gib einen Betrag an, z. B. 5.000." : "Bitte gib einen Prozentwert an, z. B. 10.");
    else if (draft.kind === "percent" && n > 100) errors.push("Ein Prozentwert kann nicht über 100 liegen.");
  }
  return errors;
}

export function bequestFromDraft(draft: BequestDraft, id: string): BequestWish {
  const wish: BequestWish = {
    id,
    kind: draft.kind,
    beneficiary: draft.beneficiary.trim().slice(0, TEXT_LIMIT),
    beneficiaryKind: draft.beneficiaryKind,
    alsoHeir: draft.beneficiaryKind === "person" ? draft.alsoHeir : "",
  };
  if (draft.kind === "item") wish.item = draft.item.trim().slice(0, TEXT_LIMIT);
  else wish.value = parseGermanNumber(draft.value) ?? undefined;
  if (draft.note.trim()) wish.note = draft.note.trim().slice(0, TEXT_LIMIT);
  return wish;
}

export function describeBequestSubject(b: BequestWish): string {
  if (b.kind === "item") return b.item ?? "";
  const n = (b.value ?? 0).toLocaleString("de-DE");
  return b.kind === "amount" ? `${n} €` : `${n} %`;
}

export function percentTotal(bequests: BequestWish[]): number {
  return bequests.reduce((total, b) => (b.kind === "percent" ? total + (b.value ?? 0) : total), 0);
}

/** Stored data may come from an import: keep only well-formed wishes. */
export function sanitizeBequests(raw: unknown): BequestWish[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((b): b is BequestWish => {
    if (!b || typeof b !== "object") return false;
    const w = b as Partial<BequestWish>;
    if (typeof w.id !== "string" || typeof w.beneficiary !== "string" || !w.beneficiary.trim()) return false;
    if (w.kind === "item") return typeof w.item === "string" && Boolean(w.item.trim());
    if (w.kind === "amount") return typeof w.value === "number" && Number.isFinite(w.value) && w.value > 0;
    if (w.kind === "percent") return typeof w.value === "number" && Number.isFinite(w.value) && w.value > 0 && w.value <= 100;
    return false;
  });
}
