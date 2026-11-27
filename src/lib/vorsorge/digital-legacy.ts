import type {
  AmanahOrdnerData,
  DigitalCategory,
  DigitalLegacyItem,
  DigitalSecureAccess,
  DigitalTreatment,
  LegacyDigitalType,
} from "@/lib/domain/types";
import { SECRET_WITHHELD, findSecretLike, isSecretLike, type SecretFinding } from "@/lib/validation/secret-like";

/**
 * AP22 EA-18.1: digital legacy, one entry per account. Structure after
 * docs/qa/produktion-20261125/ap22-endabnahme-20261127/recherche/DIGITALER-NACHLASS.md §3.
 *
 * Entries of the first version (type, description, locationHint) keep these fields word for word.
 * The new fields are derived once, without guessing: category from the old type, provider name from
 * the description, the access note from the old hint, but the last two only when the text passes
 * the secret check. A text that looks like a secret stays where it was and the entry is flagged.
 */

export const DIGITAL_CATEGORY_LABELS: Record<DigitalCategory, string> = {
  email: "E-Mail",
  social: "Soziale Netzwerke und Messenger",
  cloud_photos: "Cloud und Fotos",
  subscription: "Abos und Streaming",
  telecom: "Telefon und Internet",
  insurance: "Versicherung",
  bank_payment: "Bank und Zahlung",
  other: "Sonstiges",
};

export const DIGITAL_TREATMENT_LABELS: Record<DigitalTreatment, string> = {
  delete: "Löschen",
  cancel: "Kündigen",
  backup_data: "Daten sichern",
  keep_memories: "Fotos und Erinnerungen erhalten",
  transfer: "An eine Person übertragen",
  memorialize: "Gedenkzustand (wo der Anbieter ihn anbietet)",
  undecided: "Noch offen",
};

export const DIGITAL_SECURE_ACCESS_LABELS: Record<DigitalSecureAccess, string> = {
  pw_manager_emergency: "Notfallzugang im Passwort-Manager eingerichtet",
  provider_legacy_contact: "Nachlass- oder Inaktivitätskontakt beim Anbieter eingerichtet",
  sealed_envelope: "Versiegelter Umschlag",
  notary_lawyer: "Bei Notar oder Anwalt hinterlegt",
  trusted_person_knows: "Vertrauensperson weiß Bescheid",
  not_arranged: "Noch nicht geregelt",
};

/** Frequent providers to choose from. Only names and the category; procedures come later from research. */
export const KNOWN_PROVIDERS: readonly { id: string; name: string; category: DigitalCategory }[] = [
  { id: "google", name: "Google (Gmail, Google Fotos, YouTube)", category: "email" },
  { id: "apple", name: "Apple (iCloud)", category: "cloud_photos" },
  { id: "microsoft", name: "Microsoft (Outlook, OneDrive)", category: "email" },
  { id: "gmx", name: "GMX", category: "email" },
  { id: "webde", name: "WEB.DE", category: "email" },
  { id: "facebook", name: "Facebook", category: "social" },
  { id: "instagram", name: "Instagram", category: "social" },
  { id: "whatsapp", name: "WhatsApp", category: "social" },
  { id: "x", name: "X (Twitter)", category: "social" },
  { id: "linkedin", name: "LinkedIn", category: "social" },
  { id: "paypal", name: "PayPal", category: "bank_payment" },
  { id: "amazon", name: "Amazon", category: "subscription" },
  { id: "netflix", name: "Netflix", category: "subscription" },
  { id: "spotify", name: "Spotify", category: "subscription" },
  { id: "telekom", name: "Telekom", category: "telecom" },
  { id: "vodafone", name: "Vodafone", category: "telecom" },
  { id: "o2", name: "O2 (Telefónica)", category: "telecom" },
];

/** Old kinds → new category and, where the category says less, a finer contract type (§3 table). */
export const LEGACY_TYPE_MAPPING: Record<LegacyDigitalType, { category: DigitalCategory; contractType?: string }> = {
  email: { category: "email" },
  social: { category: "social" },
  cloud: { category: "cloud_photos" },
  subscription: { category: "subscription" },
  banking: { category: "bank_payment" },
  paypal: { category: "bank_payment" },
  password_manager: { category: "other", contractType: "password_manager" },
  emergency_access: { category: "other", contractType: "emergency_access" },
  domain: { category: "other", contractType: "domain" },
  file: { category: "other", contractType: "file" },
};

/** Labels of the first version, still shown for old entries. */
export const LEGACY_TYPE_LABELS: Record<LegacyDigitalType, string> = {
  email: "E-Mail-Konto",
  password_manager: "Passwort-Manager (nur Anbieter, nie das Master-Passwort)",
  emergency_access: "Notfallzugang",
  banking: "Online-Banking (nur Bank, keine PIN/TAN)",
  paypal: "PayPal / Zahlungsdienst",
  subscription: "Abonnement",
  social: "Social Media",
  cloud: "Cloud-Speicher",
  domain: "Domain / Website",
  file: "Wichtige Datei",
};

export const CONTRACT_TYPE_LABELS: Record<string, string> = {
  password_manager: "Passwort-Manager",
  emergency_access: "Notfallzugang",
  domain: "Domain / Website",
  file: "Wichtige Datei",
};

const CATEGORIES = Object.keys(DIGITAL_CATEGORY_LABELS) as DigitalCategory[];
const TREATMENTS = Object.keys(DIGITAL_TREATMENT_LABELS) as DigitalTreatment[];
const SECURE_ACCESS = Object.keys(DIGITAL_SECURE_ACCESS_LABELS) as DigitalSecureAccess[];
const LEGACY_TYPES = Object.keys(LEGACY_TYPE_MAPPING) as LegacyDigitalType[];
const KNOWN_IDS = KNOWN_PROVIDERS.map((p) => p.id);

/** Short fields (reference, notes): at most this many characters. */
export const REFERENCE_MAX = 60;
export const NOTE_MAX = 300;

const isObject = (v: unknown): v is Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v);
const text = (v: unknown, max = 2000): string => (typeof v === "string" ? v.slice(0, max) : "");

export function digitalCategoryOf(item: Pick<DigitalLegacyItem, "category" | "type">): DigitalCategory {
  if (item.category && CATEGORIES.includes(item.category)) return item.category;
  if (item.type && LEGACY_TYPES.includes(item.type)) return LEGACY_TYPE_MAPPING[item.type].category;
  return "other";
}

/** Badge text: the category, with the finer contract type where there is one. */
export function digitalKindLabel(item: Pick<DigitalLegacyItem, "category" | "type" | "contractType">): string {
  const base = DIGITAL_CATEGORY_LABELS[digitalCategoryOf(item)];
  const fine = item.contractType ? CONTRACT_TYPE_LABELS[item.contractType] : undefined;
  return fine ? `${base}: ${fine}` : base;
}

/** Entry from the first version (has the old kind). Its old texts are shown as "Früher eingetragen". */
export function isLegacyDigitalEntry(item: DigitalLegacyItem): boolean {
  return Boolean(item.type);
}

/** Title for lists and outputs: the provider, or the old description. */
export function digitalTitle(item: DigitalLegacyItem): string {
  return item.provider?.name.trim() || item.description.trim() || "Konto";
}

export function trustedPersonName(data: Pick<AmanahOrdnerData, "familyMembers">, item: DigitalLegacyItem): string | null {
  const person = item.trustedPersonId ? data.familyMembers.find((m) => m.id === item.trustedPersonId) : undefined;
  return person?.name.trim() || item.trustedPersonName?.trim() || null;
}

/**
 * Cleans one entry from the folder or an import and fills the new fields from old ones (§3 table).
 * Old fields are never changed or removed, unknown extra keys are kept, and the step is repeatable:
 * a field that already has a value is left alone.
 */
export function normalizeDigitalLegacyItem(raw: unknown, index: number): DigitalLegacyItem | null {
  if (!isObject(raw)) return null;
  const item = {
    ...(raw as object),
    id: text(raw.id, 100) || `digital-${index + 1}`,
    description: text(raw.description),
    locationHint: text(raw.locationHint),
  } as DigitalLegacyItem;

  if (raw.type !== undefined && !LEGACY_TYPES.includes(raw.type as LegacyDigitalType)) delete item.type;
  if (raw.category !== undefined && !CATEGORIES.includes(raw.category as DigitalCategory)) delete item.category;
  if (raw.secureAccess !== undefined && !SECURE_ACCESS.includes(raw.secureAccess as DigitalSecureAccess)) delete item.secureAccess;
  if (raw.treatments !== undefined) {
    item.treatments = Array.isArray(raw.treatments) ? [...new Set(raw.treatments.filter((t): t is DigitalTreatment => TREATMENTS.includes(t as DigitalTreatment)))] : [];
  }
  if (raw.provider !== undefined) {
    if (isObject(raw.provider) && typeof raw.provider.name === "string") {
      const knownId = typeof raw.provider.knownId === "string" && KNOWN_IDS.includes(raw.provider.knownId) ? raw.provider.knownId : undefined;
      item.provider = { name: raw.provider.name.slice(0, 200), ...(knownId ? { knownId } : {}) };
    } else delete item.provider;
  }
  for (const key of ["contractType", "reference", "treatmentNote", "trustedPersonId", "trustedPersonName", "secureAccessNote", "templateId", "updatedAt"] as const) {
    if (raw[key] !== undefined && typeof raw[key] !== "string") delete item[key];
  }

  // Derive the new fields from the first version, once and only where they are still empty.
  if (!item.category && item.type) {
    const mapped = LEGACY_TYPE_MAPPING[item.type];
    item.category = mapped.category;
    if (mapped.contractType && !item.contractType) item.contractType = mapped.contractType;
  }
  const description = item.description.trim();
  if (!item.provider && description && !isSecretLike(description)) item.provider = { name: description.slice(0, 200) };
  const hint = item.locationHint.trim();
  if (hint && item.secureAccessNote === undefined && !isSecretLike(hint)) {
    item.secureAccessNote = hint;
    if (!item.secureAccess) item.secureAccess = "not_arranged";
  }
  return item;
}

export function normalizeDigitalLegacy(raw: unknown): DigitalLegacyItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((item, i) => normalizeDigitalLegacyItem(item, i)).filter((x): x is DigitalLegacyItem => x !== null);
}

export type DigitalCheckedField = "providerName" | "reference" | "treatmentNote" | "secureAccessNote";

export interface DigitalDraft {
  providerName: string;
  reference: string;
  treatmentNote: string;
  secureAccessNote: string;
}

/**
 * Findings per field; an entry with findings is not saved. Reference and notes allow at most 4
 * digits in a row (contract numbers are not stored, see owner question in the research §3).
 */
export function digitalEntryFindings(draft: DigitalDraft): Partial<Record<DigitalCheckedField, SecretFinding[]>> {
  const result: Partial<Record<DigitalCheckedField, SecretFinding[]>> = {};
  const check = (field: DigitalCheckedField, findings: SecretFinding[]) => {
    if (findings.length) result[field] = findings;
  };
  check("providerName", findSecretLike(draft.providerName));
  check("reference", findSecretLike(draft.reference, { maxDigitsInRow: 4 }));
  check("treatmentNote", findSecretLike(draft.treatmentNote, { maxDigitsInRow: 4 }));
  check("secureAccessNote", findSecretLike(draft.secureAccessNote, { maxDigitsInRow: 4 }));
  return result;
}

/** Whether any text of the entry, old or new, looks like a secret (shown as a warning on the entry). */
export function digitalEntryHasSecrets(item: DigitalLegacyItem): boolean {
  return [item.provider?.name, item.description, item.locationHint, item.treatmentNote, item.secureAccessNote].some((t) => isSecretLike(t)) || isSecretLike(item.reference, { maxDigitsInRow: 4 });
}

const safe = (v: string | undefined, options?: { maxDigitsInRow?: number }) => (v?.trim() ? (isSecretLike(v, options) ? SECRET_WITHHELD : v.trim()) : "");

/**
 * One entry for outputs (PDF, emergency package, export): kind, title and a detail line. Texts that
 * look like secrets are not printed; a note to check them is printed instead.
 */
export function digitalEntrySummary(data: Pick<AmanahOrdnerData, "familyMembers">, item: DigitalLegacyItem): { kind: string; title: string; detail: string } {
  const person = trustedPersonName(data, item);
  const providerName = item.provider?.name.trim();
  const access = [item.secureAccess ? DIGITAL_SECURE_ACCESS_LABELS[item.secureAccess] : "", safe(item.secureAccessNote, { maxDigitsInRow: 4 })].filter(Boolean).join(": ");
  const oldHintNotTakenOver = item.locationHint.trim() && item.secureAccessNote === undefined ? safe(item.locationHint) : "";
  const detail = [
    item.reference?.trim() && `Referenz: ${safe(item.reference, { maxDigitsInRow: 4 })}`,
    item.treatments?.length && `Wunsch: ${item.treatments.map((t) => DIGITAL_TREATMENT_LABELS[t]).join(", ")}`,
    safe(item.treatmentNote, { maxDigitsInRow: 4 }) && `Hinweis: ${safe(item.treatmentNote, { maxDigitsInRow: 4 })}`,
    person && `Zuständig: ${person}`,
    access && `Zugang: ${access}`,
    oldHintNotTakenOver && `Früher eingetragen: ${oldHintNotTakenOver}`,
  ]
    .filter(Boolean)
    .join(" · ");
  return { kind: digitalKindLabel(item), title: providerName ? safe(providerName) : safe(item.description) || "Konto", detail };
}

/** A new entry from a plain hint (assistant, old power-of-attorney text). Category "Sonstiges". */
export function digitalEntryFromHint(id: string, hint: string, now = new Date().toISOString()): DigitalLegacyItem {
  return { id, category: "other", provider: { name: hint.trim().slice(0, 200) }, description: "", locationHint: "", treatments: [], updatedAt: now };
}
