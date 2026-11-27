import Link from "next/link";

/** A calm, always visible note: this is a preview of unpublished, not yet reviewed drafts. One line on phones. */
export function PreviewNote() {
  return (
    <div className="border-b border-[var(--wz-line)] bg-[var(--wz-gold-soft)]" role="note" data-testid="draft-banner">
      <p className="mx-auto max-w-6xl px-5 py-2 text-[0.8125rem] leading-snug text-[var(--wz-ink)] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--wz-gold)] shrink-0" aria-hidden />
        <span>
          <strong>Vorschau, nicht veröffentlicht</strong>
          <span className="hidden sm:inline"> · Entwurf, fachliche Prüfung durch islamische Fachpersonen und Juristen steht aus. Keine Fatwa, keine Rechtsberatung.</span>
          <span className="sm:hidden"> · fachlich noch ungeprüft</span>
        </span>
        <Link href="/wissen/redaktion/artikel" className="ml-auto shrink-0 font-semibold underline decoration-[var(--wz-gold)] underline-offset-2" data-testid="preview-editorial-link">
          Redaktion
        </Link>
      </p>
    </div>
  );
}
