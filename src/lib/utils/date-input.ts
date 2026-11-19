/**
 * Dates are typed as TT.MM.JJJJ and stored as ISO (JJJJ-MM-TT), so that every part of the app reads
 * them the same way. Older folders may still hold "TT.MM.JJJJ" or free text; those are read as well.
 */

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
const GERMAN = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/;

function validParts(day: number, month: number, year: number): boolean {
  if (year < 1900 || month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

const pad = (n: number) => String(n).padStart(2, "0");

/** ISO from "TT.MM.JJJJ" or ISO; null when it is no real calendar date. */
export function toIsoDate(value: string): string | null {
  const text = value.trim();
  const iso = ISO.exec(text);
  if (iso) {
    const [y, m, d] = [Number(iso[1]), Number(iso[2]), Number(iso[3])];
    return validParts(d, m, y) ? text : null;
  }
  const de = GERMAN.exec(text);
  if (de) {
    const [d, m, y] = [Number(de[1]), Number(de[2]), Number(de[3])];
    return validParts(d, m, y) ? `${y}-${pad(m)}-${pad(d)}` : null;
  }
  return null;
}

/** For display and print: ISO becomes TT.MM.JJJJ, anything else stays as the person typed it. */
export function formatDisplayDate(value: string | null | undefined): string {
  const text = (value ?? "").trim();
  const iso = ISO.exec(text);
  return iso ? `${iso[3]}.${iso[2]}.${iso[1]}` : text;
}

/**
 * Formats while typing: digits only, a dot after day and month. Deleting never puts a dot back, so the
 * cursor does not jump. Pasted ISO dates and 8 plain digits are turned into TT.MM.JJJJ.
 */
export function formatDateTyping(next: string, previous: string): string {
  const trimmed = next.trim();
  if (ISO.test(trimmed)) return formatDisplayDate(trimmed);
  if (next.length < previous.length) return next.replace(/[^\d.]/g, "").slice(0, 10);
  const parts = next.replace(/[^\d.]/g, "").split(".");
  let day: string;
  let month: string;
  let year: string;
  if (parts.length === 1) {
    const digits = parts[0].slice(0, 8);
    [day, month, year] = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4)];
  } else {
    // A dot typed after one digit ("1.3.1985") means a one-digit day or month.
    day = parts[0].slice(0, 2).padStart(parts[0] ? 2 : 0, "0");
    if (parts.length === 2) {
      [month, year] = [parts[1].slice(0, 2), parts[1].slice(2, 6)];
    } else {
      month = parts[1].slice(0, 2).padStart(parts[1] ? 2 : 0, "0");
      year = parts.slice(2).join("").slice(0, 4);
    }
  }
  let out = day;
  if (day.length === 2) out += ".";
  out += month;
  if (month.length === 2) out += ".";
  return (out + year).slice(0, 10);
}

export type DateCheck = "empty" | "incomplete" | "invalid" | "future" | "ok";

export function checkBirthDate(display: string, today: Date = new Date()): DateCheck {
  const text = display.trim();
  if (!text) return "empty";
  if (!GERMAN.test(text) && !ISO.test(text)) return text.replace(/\D/g, "").length < 8 ? "incomplete" : "invalid";
  const iso = toIsoDate(text);
  if (!iso) return "invalid";
  return iso > today.toISOString().slice(0, 10) ? "future" : "ok";
}

/**
 * The value a date field may store: "" for a deliberately empty field, ISO for a real calendar date,
 * null for anything unfinished or impossible (e.g. "03.07." or "31.02.1962"). Input, saving and the
 * document check all use this same calendar check (toIsoDate), so no impossible date reaches paper.
 */
export function storableDate(text: string): string | null {
  const t = text.trim();
  return t ? toIsoDate(t) : "";
}

export const DATE_CHECK_MESSAGES: Record<Exclude<DateCheck, "empty" | "ok">, string> = {
  incomplete: "Bitte vollständig als TT.MM.JJJJ eingeben, zum Beispiel 15.03.1980.",
  invalid: "Dieses Datum gibt es nicht. Bitte Tag und Monat prüfen.",
  future: "Das Datum liegt in der Zukunft. Bitte prüfen.",
};

/**
 * The hint at a date field whose draft cannot be stored (P2.6 owner acceptance): short and in the
 * person's words. A birth date names itself; other date fields say "Datum".
 */
export function dateDraftMessage(check: "incomplete" | "invalid", birth: boolean): string {
  if (check === "incomplete") return birth ? "Geburtsdatum noch unvollständig" : "Datum noch unvollständig";
  return birth ? "Bitte gib ein gültiges Geburtsdatum ein" : "Bitte gib ein gültiges Datum ein";
}
