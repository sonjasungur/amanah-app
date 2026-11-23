"use client";

import { useId, useState, type FormEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { CONTACT_LIMITS, CONTACT_TOPICS, validateContact, type ContactInput } from "@/lib/contact/contact-form";

type State = { kind: "idle" } | { kind: "sending" } | { kind: "sent" } | { kind: "error"; message: string; field?: keyof ContactInput };

/** Contact form (owner order 23.11.2026). Sends to /api/contact; nothing is stored in the browser. */
export function ContactForm() {
  const id = useId();
  const [state, setState] = useState<State>({ kind: "idle" });
  const [message, setMessage] = useState("");

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const raw = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      topic: String(form.get("topic") ?? "allgemein"),
      message: String(form.get("message") ?? ""),
    };
    const check = validateContact(raw);
    if (!check.ok) return setState({ kind: "error", message: check.error, field: check.field });
    setState({ kind: "sending" });
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...raw, website: String(form.get("website") ?? "") }),
      });
      const body = (await res.json().catch(() => ({}))) as { error?: string; field?: keyof ContactInput };
      if (!res.ok) return setState({ kind: "error", message: body.error ?? "Senden war nicht möglich. Bitte versuche es später noch einmal.", field: body.field });
      setState({ kind: "sent" });
    } catch {
      setState({ kind: "error", message: "Keine Verbindung. Bitte prüfe dein Internet und versuche es noch einmal." });
    }
  }

  if (state.kind === "sent") {
    return (
      <div className="rounded-2xl border-2 border-emerald/40 bg-accent-soft p-6" role="status" data-testid="contact-sent">
        <h2 className="text-xl font-bold text-foreground">Danke für deine Nachricht.</h2>
        <p className="text-body text-muted mt-2">Sie ist bei uns angekommen. Wir antworten an die angegebene E-Mail-Adresse, in der Regel innerhalb weniger Werktage.</p>
      </div>
    );
  }

  const fieldError = (f: keyof ContactInput) => (state.kind === "error" && state.field === f ? state.message : null);
  const describedBy = (f: keyof ContactInput) => (fieldError(f) ? `${id}-${f}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5" data-testid="contact-form">
      <div>
        <label htmlFor={`${id}-topic`} className="block font-semibold text-foreground mb-1.5">Worum geht es?</label>
        <select id={`${id}-topic`} name="topic" defaultValue="allgemein" className="w-full rounded-xl border-2 border-primary/25 bg-white px-4 py-2.5 text-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30">
          {CONTACT_TOPICS.map((t) => (
            <option key={t.id} value={t.id}>{t.label}</option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor={`${id}-name`} className="block font-semibold text-foreground mb-1.5">Name <span className="font-normal text-muted">(freiwillig)</span></label>
        <Input id={`${id}-name`} name="name" autoComplete="name" maxLength={CONTACT_LIMITS.name} aria-invalid={!!fieldError("name")} aria-describedby={describedBy("name")} />
        {fieldError("name") && <p id={`${id}-name-error`} className="text-sm text-destructive mt-1" role="alert">{fieldError("name")}</p>}
      </div>
      <div>
        <label htmlFor={`${id}-email`} className="block font-semibold text-foreground mb-1.5">E-Mail-Adresse für die Antwort</label>
        <Input id={`${id}-email`} name="email" type="email" required autoComplete="email" inputMode="email" maxLength={CONTACT_LIMITS.email} aria-invalid={!!fieldError("email")} aria-describedby={describedBy("email")} />
        {fieldError("email") && <p id={`${id}-email-error`} className="text-sm text-destructive mt-1" role="alert">{fieldError("email")}</p>}
      </div>
      <div>
        <label htmlFor={`${id}-message`} className="block font-semibold text-foreground mb-1.5">Deine Nachricht</label>
        <Textarea
          id={`${id}-message`}
          name="message"
          required
          rows={7}
          maxLength={CONTACT_LIMITS.messageMax}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          aria-invalid={!!fieldError("message")}
          aria-describedby={[`${id}-message-hint`, describedBy("message")].filter(Boolean).join(" ")}
        />
        <p id={`${id}-message-hint`} className="text-sm text-muted mt-1">
          Bitte schreib keine Gesundheitsangaben, Passwörter oder Daten anderer Personen in die Nachricht. {message.length}/{CONTACT_LIMITS.messageMax}
        </p>
        {fieldError("message") && <p id={`${id}-message-error`} className="text-sm text-destructive mt-1" role="alert">{fieldError("message")}</p>}
      </div>
      {/* Honeypot for bots: hidden from people and screen readers. */}
      <div aria-hidden className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden">
        <label htmlFor={`${id}-website`}>Website</label>
        <input id={`${id}-website`} name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="text-sm text-muted" data-testid="contact-privacy">
        Wir verwenden deine Angaben nur, um deine Anfrage zu beantworten. Die Nachricht wird per E-Mail an uns übermittelt und
        nicht in der App gespeichert. Mehr dazu in der{" "}
        <Link href="/datenschutz" className="text-primary font-semibold hover:underline">Datenschutzerklärung</Link>.
      </p>
      {state.kind === "error" && !state.field && (
        <p className="text-sm text-destructive" role="alert" data-testid="contact-error">{state.message}</p>
      )}
      <Button type="submit" size="lg" disabled={state.kind === "sending"} data-testid="contact-submit">
        {state.kind === "sending" ? "Wird gesendet …" : "Nachricht senden"}
      </Button>
    </form>
  );
}
