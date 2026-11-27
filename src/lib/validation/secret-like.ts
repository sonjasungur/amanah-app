/**
 * One shared check for inputs that look like passwords, PINs, bank account numbers or recovery
 * phrases (Datenlandkarte EA-15.1, Abschnitt 5). Wasiyya stores where things are and who knows
 * about them, never the secrets themselves. The check runs on plain text and has no side effects,
 * so forms, imports and the server can all use it. It never logs or returns the matched value.
 *
 * Phone numbers are not flagged: phone fields have their own type and are not passed here.
 */

export type SecretFindingKind = "keyword_value" | "iban" | "card_number" | "seed_phrase" | "pin_code" | "long_number";

export interface SecretFinding {
  kind: SecretFindingKind;
  /** Plain-language message for the person; never contains the matched value. */
  message: string;
}

export const SECRET_MESSAGES: Record<SecretFindingKind, string> = {
  keyword_value: "Das sieht nach einem Passwort, einer PIN oder einem Zugangscode aus. Bitte trage nur ein, wo deine Familie sicher herankommt, nie den Code selbst.",
  iban: "Das sieht nach einer IBAN oder Kontonummer aus. Bitte nenne nur die Bank, nicht die Nummer.",
  card_number: "Das sieht nach einer Kartennummer aus. Bitte nenne nur den Anbieter, nicht die Nummer.",
  seed_phrase: "Das sieht nach einer Wiederherstellungsphrase (Seed) aus. Bitte trage sie hier nie ein.",
  pin_code: "Das sieht nach einer PIN, TAN oder einem Zahlencode aus. Bitte trage den Code hier nie ein.",
  long_number: "Bitte keine langen Nummern: höchstens 4 Ziffern am Stück, z. B. die letzten 4 Ziffern einer Vertragsnummer.",
};

/** Printed instead of a text that looks like a password, PIN or account number (Datenlandkarte §7 R-9). */
export const SECRET_WITHHELD = "Nicht ausgegeben: Der Text sieht nach Zugangsdaten oder einer Kontonummer aus. Bitte in Wasiyya prüfen.";

const KEYWORDS = [
  "master-?passwort",
  "master-?password",
  "passwort",
  "password",
  "passwd",
  "kennwort",
  "zugangscode",
  "pin",
  "puk",
  "tan",
  "seed",
  "recovery[- ]?phrase",
  "wiederherstellungs(?:phrase|code|schlüssel)",
];

/**
 * A keyword followed by ":" or "=" and a value, e.g. "Passwort: Sonne123" or "PIN=1234". A hint such
 * as "Passwort: im Passwort-Manager" is fine: the value must contain a digit or symbol, or stand alone.
 */
const KEYWORD_VALUE = new RegExp(`(?:^|[^\\p{L}])(?:${KEYWORDS.join("|")})\\s*[:=]\\s*(\\S+)(.*)`, "giu");

function hasKeywordValue(text: string): boolean {
  for (const match of text.matchAll(KEYWORD_VALUE)) {
    const token = match[1].replace(/[.,;!?]+$/, "");
    const rest = match[2] ?? "";
    if (/\d|[^\p{L}\-]/u.test(token) || /^\s*(?:$|[,;.\n])/.test(rest)) return true;
  }
  return false;
}

/** Digits right after PIN/TAN/PUK/Code/Kombination, e.g. "PIN 1234", "Tresor-Code ist 887766". */
const PIN_CODE = /(?:^|[^\p{L}])(?:pin|puk|tan|code|kombination|zahlenschloss)\s*(?:ist|lautet|nr\.?|nummer)?\s*[:=-]?\s*\d{4,}/iu;

/** Candidate IBANs: two letters, two digits, then 11–30 letters or digits, spaces allowed every few characters. */
const IBAN_CANDIDATE = /\b[A-Z]{2}\d{2}(?:[ ]?[A-Z0-9]){11,30}\b/gi;

/** 13–19 digits, optionally grouped with spaces or dashes. */
const CARD_CANDIDATE = /(?:\d[ -]?){12,18}\d/g;

function ibanChecksumValid(compact: string): boolean {
  const rearranged = compact.slice(4) + compact.slice(0, 4);
  let remainder = 0;
  for (const ch of rearranged) {
    const code = ch >= "A" && ch <= "Z" ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of code) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1;
}

function looksLikeIban(text: string): boolean {
  for (const match of text.matchAll(IBAN_CANDIDATE)) {
    const compact = match[0].replace(/\s+/g, "").toUpperCase();
    if (compact.length < 15 || compact.length > 34) continue;
    const digits = compact.replace(/\D/g, "").length;
    // A real IBAN, or something built like one (mostly digits), e.g. a mistyped German IBAN.
    if (ibanChecksumValid(compact) || digits >= compact.length - 6) return true;
  }
  return false;
}

function luhnValid(digits: string): boolean {
  let sum = 0;
  let double = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let n = Number(digits[i]);
    if (double) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    double = !double;
  }
  return sum % 10 === 0;
}

function looksLikeCardNumber(text: string): boolean {
  for (const match of text.matchAll(CARD_CANDIDATE)) {
    const digits = match[0].replace(/\D/g, "");
    if (digits.length >= 13 && digits.length <= 19 && !/^(\d)\1+$/.test(digits) && luhnValid(digits)) return true;
  }
  return false;
}

/**
 * Recovery phrases are 12, 15, 18, 21 or 24 short lowercase words and nothing else. Ordinary
 * sentences have capital letters (German nouns), punctuation or longer words, so they do not match.
 */
function looksLikeSeedPhrase(text: string): boolean {
  const words = text.trim().split(/\s+/);
  if (![12, 15, 18, 21, 24].includes(words.length)) return false;
  return words.every((w) => /^[a-z]{3,8}$/.test(w));
}

export interface SecretCheckOptions {
  /** Reference fields (contract or customer reference): no more than 4 digits in a row. */
  maxDigitsInRow?: number;
}

/** All findings for one text. Empty when nothing looks like a secret. */
export function findSecretLike(text: string | null | undefined, options: SecretCheckOptions = {}): SecretFinding[] {
  if (!text || !text.trim()) return [];
  const kinds = new Set<SecretFindingKind>();
  if (hasKeywordValue(text)) kinds.add("keyword_value");
  if (PIN_CODE.test(text)) kinds.add("pin_code");
  if (looksLikeIban(text)) kinds.add("iban");
  if (looksLikeCardNumber(text)) kinds.add("card_number");
  if (looksLikeSeedPhrase(text)) kinds.add("seed_phrase");
  if (options.maxDigitsInRow !== undefined && new RegExp(`\\d{${options.maxDigitsInRow + 1},}`).test(text.replace(/[ .\-/]/g, ""))) {
    if (!kinds.has("iban") && !kinds.has("card_number")) kinds.add("long_number");
  }
  return [...kinds].map((kind) => ({ kind, message: SECRET_MESSAGES[kind] }));
}

export function isSecretLike(text: string | null | undefined, options?: SecretCheckOptions): boolean {
  return findSecretLike(text, options).length > 0;
}

/**
 * Walks any value (a folder section, an import) and returns the paths of strings that look like
 * secrets. Only paths and kinds come back, never the values, so the result can be shown or logged.
 */
export function scanForSecrets(value: unknown, path = "", out: { path: string; kinds: SecretFindingKind[] }[] = []): { path: string; kinds: SecretFindingKind[] }[] {
  if (typeof value === "string") {
    const findings = findSecretLike(value);
    if (findings.length) out.push({ path, kinds: findings.map((f) => f.kind) });
  } else if (Array.isArray(value)) {
    value.forEach((v, i) => scanForSecrets(v, `${path}[${i}]`, out));
  } else if (value !== null && typeof value === "object") {
    for (const [key, v] of Object.entries(value as Record<string, unknown>)) scanForSecrets(v, path ? `${path}.${key}` : key, out);
  }
  return out;
}
