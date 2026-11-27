import { NextResponse } from "next/server";
import { crossOriginRejected } from "@/lib/server/auth-utils";
import { isSameOriginRequest } from "@/lib/server/session-cookie";
import { HOUR, clientAddress, consumeLimits, tooManyAttempts } from "@/lib/server/auth-rate-limit";
import { MailNotConfiguredError, sendMail } from "@/lib/server/mailer";
import { CONTACT_TOPICS, contactRecipient, validateContact, type ContactInput } from "@/lib/contact/contact-form";

/**
 * Contact form (owner order 23.11.2026): the message goes by e-mail to the imprint address
 * (contact@mscisystems.com), with Reply-To set to the sender. Nothing is stored in the app and
 * nothing is logged; the sender gets no automatic mail, so the form cannot be used to send mail
 * to third parties.
 */
export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return crossOriginRejected();
  const body = (await request.json().catch(() => ({}))) as Partial<ContactInput> & { website?: string };

  // Honeypot: real visitors never see this field. Answer like a success, send nothing.
  if (typeof body.website === "string" && body.website.trim() !== "") return NextResponse.json({ ok: true });

  const result = validateContact(body);
  if (!result.ok) return NextResponse.json({ error: result.error, field: result.field }, { status: 400 });
  const input = result.value;

  const limit = await consumeLimits([
    { scope: "contact:ip", subject: clientAddress(request), max: 5, windowMs: HOUR },
    { scope: "contact:email", subject: input.email, max: 3, windowMs: HOUR },
  ]);
  if (!limit.allowed) return tooManyAttempts(limit, "Zu viele Nachrichten in kurzer Zeit. Bitte versuche es später noch einmal.");

  const to = contactRecipient();
  const topic = CONTACT_TOPICS.find((t) => t.id === input.topic)?.label ?? "Allgemein";
  const text = [
    "Neue Nachricht über das Kontaktformular von Wasiyya.",
    "",
    `Thema: ${topic}`,
    `Name: ${input.name || "(nicht angegeben)"}`,
    `E-Mail: ${input.email}`,
    `Eingegangen: ${new Date().toISOString()}`,
    "",
    "Nachricht:",
    input.message,
    "",
    "Antworten mit „Antworten“ gehen direkt an die Absenderin bzw. den Absender.",
  ].join("\n");

  let delivered = false;
  try {
    delivered = await sendMail({ to, kind: "contact", subject: `Kontaktformular Wasiyya: ${topic}`, text, replyTo: input.email });
  } catch (e) {
    if (!(e instanceof MailNotConfiguredError)) throw e;
  }
  if (!delivered) {
    return NextResponse.json({ error: `Deine Nachricht konnte gerade nicht gesendet werden. Bitte schreib uns direkt an ${to}.` }, { status: 503 });
  }
  return NextResponse.json({ ok: true });
}
