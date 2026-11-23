import { IMPRINT } from "@/lib/legal/imprint";

/** Shared by the contact page (client) and the API route (server). */
export const CONTACT_TOPICS = [
  { id: "allgemein", label: "Allgemeine Frage" },
  { id: "konto", label: "Konto und Daten" },
  { id: "fehler", label: "Fehler melden" },
  { id: "partner", label: "Partner und Zusammenarbeit" },
  { id: "presse", label: "Presse" },
] as const;

export type ContactTopicId = (typeof CONTACT_TOPICS)[number]["id"];

export interface ContactInput {
  name: string;
  email: string;
  topic: ContactTopicId;
  message: string;
}

export const CONTACT_LIMITS = { name: 120, email: 254, messageMin: 10, messageMax: 4000 } as const;

const EMAIL_RE = /^[^\s@,;<>"]+@[^\s@,;<>"]+\.[a-z]{2,}$/i;

export type ContactValidation =
  | { ok: true; value: ContactInput }
  | { ok: false; field: keyof ContactInput; error: string };

export function validateContact(raw: Partial<Record<keyof ContactInput, unknown>>): ContactValidation {
  const name = typeof raw.name === "string" ? raw.name.replace(/[\r\n]+/g, " ").trim() : "";
  const email = typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const message = typeof raw.message === "string" ? raw.message.replace(/\r\n/g, "\n").trim() : "";
  const topic = CONTACT_TOPICS.some((t) => t.id === raw.topic) ? (raw.topic as ContactTopicId) : "allgemein";

  if (name.length > CONTACT_LIMITS.name) return { ok: false, field: "name", error: `Der Name darf höchstens ${CONTACT_LIMITS.name} Zeichen haben.` };
  if (!email || email.length > CONTACT_LIMITS.email || !EMAIL_RE.test(email)) {
    return { ok: false, field: "email", error: "Bitte gib eine gültige E-Mail-Adresse an, damit wir antworten können." };
  }
  if (message.length < CONTACT_LIMITS.messageMin) {
    return { ok: false, field: "message", error: `Bitte schreib uns mindestens ${CONTACT_LIMITS.messageMin} Zeichen.` };
  }
  if (message.length > CONTACT_LIMITS.messageMax) {
    return { ok: false, field: "message", error: `Die Nachricht darf höchstens ${CONTACT_LIMITS.messageMax} Zeichen haben.` };
  }
  return { ok: true, value: { name, email, topic, message } };
}

/** Where contact messages go: AMANAH_CONTACT_TO, otherwise the imprint address. */
export function contactRecipient(env: NodeJS.ProcessEnv = process.env): string {
  const configured = env.AMANAH_CONTACT_TO?.trim();
  return configured && EMAIL_RE.test(configured) ? configured : IMPRINT.email;
}
