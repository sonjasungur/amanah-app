import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { linkButtonClassName } from "@/components/ui/button";
import { Disclaimer } from "@/components/ui/disclaimer";
import { START_ALWAYS_FREE, START_BASIS, START_KOMPLETT_PLANNED, START_PLUS_PLANNED, START_PLUS_STATUS, START_PLUS_SUBTITLE, START_PREMIUM_PLANNED, START_PREMIUM_SUMMARY, START_SCOPE_NOTE } from "@/lib/billing/start-offer";
import { publicPageMetadata } from "@/lib/seo/public-pages";
import { Check } from "lucide-react";

export const metadata = publicPageMetadata("/preise");

/**
 * Pricing (owner decision 25.11.2026): no subscription, no membership fee, no automatic renewal. Free entry,
 * later packages paid once. Basis is free today; paid packages stay "in preparation" without price and
 * without purchase until the owner releases price, terms and payment. Will preparation follows only after
 * legal review. Design "Royal Imperial".
 */
const PRINCIPLES = [
  "Kein Abo",
  "Einmal bezahlen",
  "Upgrade: nur die Differenz zahlen",
  "Islamisches Wissen bleibt kostenlos",
] as const;

const FAQ: readonly { q: string; a: string }[] = [
  {
    q: "Übernimmt Wasiyya die Bestattung oder Überführung?",
    a: "Nein. Wasiyya führt keine Bestattung, Überführung, Waschung oder Behördengänge durch. Du planst mit Wasiyya deine Wünsche und hältst Unterlagen und Ansprechpartner fest – so weiß deine Familie im Ernstfall, was zu tun ist, und kann es mit Moschee, Bestatter und Behörden schnell umsetzen.",
  },
  {
    q: "Gibt es ein Abo?",
    a: "Nein. Wasiyya hat kein Abo, keine Mitgliedsgebühr und keine automatische Verlängerung. Pakete bezahlst du später einmal.",
  },
  {
    q: "Muss ich etwas bezahlen, um anzufangen?",
    a: "Nein. Vorsorge-Check, Notfallkarte, einfache Vermögensübersicht, Familiengespräch und islamisches Wissen sind kostenlos und bleiben es. Für den Check brauchst du kein Konto.",
  },
  {
    q: "Was passiert mit meinen Angaben, wenn die Pakete kommen?",
    a: "Was du gespeichert hast, bleibt lesbar. Export und Löschen bleiben immer kostenlos. Bestehende Konten behalten die Funktionen, die vor der Einführung der Pakete verfügbar waren.",
  },
  {
    q: "Kann ich später ein größeres Paket wählen?",
    a: "Ja. Du zahlst dann nur die Differenz zu dem Paket, das du schon hast.",
  },
  {
    q: "Erstellt Wasiyya ein Testament?",
    a: "Nein. Wasiyya hilft dir, Wünsche und Unterlagen zu ordnen. Später zeigt Wasiyya nach fachlicher Prüfung eine Gegenüberstellung islamischer und deutscher Erbquoten zur Orientierung. Das Testament und seine rechtsverbindliche Gestaltung bleiben bei Anwalt oder Notar, religiöse Fragen klärst du mit einer islamischen Fachperson.",
  },
];

export default function PreisePage() {
  const showRegister = isPublicRegistrationEnabled();

  return (
    <div data-testid="pricing-start">
      <section className="on-dark wasiyya-hero text-white">
        <div className="max-w-7xl mx-auto px-4 pt-12 pb-14 md:pt-20 md:pb-20 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#F2CF6C]">Pakete</p>
          <h1 className="text-display mt-4 text-balance">
            Was Wasiyya kostet – <span className="gold-text">einmal statt immer wieder.</span>
          </h1>
          <p className="text-body-lg text-white/85 mt-5 max-w-2xl mx-auto">
            Wasiyya startet kostenlos. Für den Vorsorge-Check brauchst du kein Konto, und es gibt kein Abo. Spätere
            Pakete bezahlst du einmal.
          </p>
          <ul className="mt-7 flex flex-wrap justify-center gap-2.5" aria-label="Grundsätze">
            {PRINCIPLES.map((p) => (
              <li key={p} className="rounded-full px-4 py-1.5 text-sm text-[#F6E3A6] ring-1 ring-[#F2CF6C]/45 bg-white/[0.05]">
                {p}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12 md:py-16">
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4 items-stretch">
          <article className="gold-frame-strong rounded-3xl p-7 flex flex-col shadow-[0_24px_60px_-24px_rgba(11,18,38,0.35)]" data-testid="pricing-basis">
            <p className="inline-block self-start px-3 py-1 rounded-full wasiyya-cta text-xs font-bold uppercase tracking-wider">Kostenlos</p>
            <h2 className="text-section-title text-primary-dark mt-4">Basis</h2>
            <p className="text-body text-muted mt-1">Für alle, die jetzt beginnen wollen.</p>
            <ul className="mt-6 space-y-4 flex-1">
              {START_BASIS.map((item) => (
                <li key={item.title} className="flex gap-3">
                  <Check size={20} className="text-accent shrink-0 mt-0.5" aria-hidden />
                  <span>
                    <span className="font-semibold text-foreground">{item.title}</span>
                    <span className="block text-sm text-muted">{item.text}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted border-t border-border pt-4">{START_ALWAYS_FREE}</p>
            <Link href="/check" className="wasiyya-cta mt-6 inline-flex items-center justify-center rounded-xl font-bold min-h-[52px] px-5 text-center">
              {BRAND.ctaPrimary}
            </Link>
          </article>

          <article className="on-dark rounded-3xl bg-[radial-gradient(ellipse_at_50%_0%,#24336B,#0E1630_60%,#0B1226)] text-white p-7 ring-1 ring-[#D4A537]/50 shadow-[0_30px_70px_-24px_rgba(11,18,38,0.6)] flex flex-col" data-testid="pricing-plus">
            <p className="inline-block self-start px-3 py-1 rounded-full ring-1 ring-[#F2CF6C]/60 text-[#F2CF6C] text-xs font-bold uppercase tracking-wider">In Vorbereitung · einmalig</p>
            <h2 className="text-section-title mt-4">Wasiyya Vorsorge</h2>
            <p className="text-body text-white/80 mt-1">{START_PLUS_SUBTITLE}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {START_PLUS_PLANNED.map((t) => (
                <li key={t} className="flex gap-3 text-white/90">
                  <Check size={20} className="text-[#F2CF6C] shrink-0 mt-0.5" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/85 border-t border-white/15 pt-4" data-testid="pricing-plus-status">
              {START_PLUS_STATUS}
            </p>
          </article>

          <article className="gold-frame rounded-3xl p-7 flex flex-col" data-testid="pricing-komplett">
            <p className="inline-block self-start px-3 py-1 rounded-full bg-accent-soft text-primary text-xs font-bold uppercase tracking-wider">In Vorbereitung · einmalig</p>
            <h2 className="text-section-title text-primary-dark mt-4">Wasiyya Komplett</h2>
            <p className="text-body text-muted mt-1">Vorsorge und Testament vorbereiten.</p>
            <ul className="mt-6 space-y-3 flex-1">
              {START_KOMPLETT_PLANNED.map((t) => (
                <li key={t} className="flex gap-3 text-foreground">
                  <Check size={20} className="text-accent shrink-0 mt-0.5" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted border-t border-border pt-4">Die Testament-Vorbereitung folgt erst nach juristischer Prüfung.</p>
          </article>

          <article className="gold-frame rounded-3xl p-7 flex flex-col" data-testid="pricing-later">
            <p className="inline-block self-start px-3 py-1 rounded-full bg-accent-soft text-primary text-xs font-bold uppercase tracking-wider">Später · individuell</p>
            <h2 className="text-section-title text-primary-dark mt-4">Premium – Rundum-sorglos</h2>
            <p className="text-body text-muted mt-1">{START_PREMIUM_SUMMARY}</p>
            <ul className="mt-6 space-y-3 flex-1">
              {START_PREMIUM_PLANNED.map((t) => (
                <li key={t} className="flex gap-3 text-foreground">
                  <Check size={20} className="text-accent shrink-0 mt-0.5" aria-hidden />
                  {t}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted border-t border-border pt-4">Das Testament selbst entsteht immer bei dir, beim Notar oder mit einer Kanzlei. Wasiyya bietet keine Rechtsberatung. Noch nicht verfügbar.</p>
          </article>
        </div>

        <div className="mt-12 rounded-3xl bg-card border border-border p-6 md:p-8 grid gap-2 md:grid-cols-[auto_1fr] md:gap-6 items-center">
          <p className="text-section-title text-primary-dark">Sadaqa Jariya</p>
          <p className="text-body text-muted">Das islamische Wissen auf Wasiyya ist und bleibt für alle kostenlos und werbefrei.</p>
        </div>

        <section className="mt-14" aria-labelledby="pricing-faq">
          <p className="gold-frame rounded-2xl p-5 mb-10 text-foreground" data-testid="pricing-scope-note">
            {START_SCOPE_NOTE}
          </p>
          <h2 id="pricing-faq" className="text-section-title text-primary-dark mb-6">Häufige Fragen</h2>
          <dl className="grid gap-6 md:grid-cols-2">
            {FAQ.map((f) => (
              <div key={f.q} className="border-t-2 border-[#D4A537]/50 pt-4">
                <dt className="font-semibold text-foreground text-lg">{f.q}</dt>
                <dd className="text-body text-muted mt-1.5">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="mt-12">
          <Disclaimer />
        </div>
      </section>

      <section className="on-dark wasiyya-hero text-white">
        <div className="max-w-4xl mx-auto px-4 py-14 md:py-18 text-center">
          <h2 className="text-section-title text-balance">Bereit für deine Vorsorge?</h2>
          <p className="text-body-lg text-white/85 mt-3">Starte kostenlos mit dem Vorsorge-Check. Ein Konto ist dafür nicht nötig.</p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/check" className="wasiyya-cta inline-flex items-center justify-center rounded-xl font-bold min-h-[52px] px-7 text-center">
              {BRAND.ctaPrimary}
            </Link>
            {showRegister && (
              <Link href="/register" className={linkButtonClassName({ variant: "outline", size: "lg", className: "bg-transparent text-white border-[#D4A537]/70 hover:bg-white/5" })}>
                Konto erstellen — Vorsorge beginnen
              </Link>
            )}
            <Link href="/login" className={linkButtonClassName({ variant: "outline", size: "lg", className: "bg-transparent text-white border-white/30 hover:bg-white/5" })}>
              Anmelden
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
