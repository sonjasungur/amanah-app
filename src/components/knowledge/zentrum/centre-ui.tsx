import Link from "next/link";
import type { ReactNode } from "react";
import { Search } from "lucide-react";
import type { FullArticle } from "@/modules/islamic-knowledge/full-articles";
import { CENTRE_REVIEW_STAGES, centreReviewState } from "@/modules/islamic-knowledge/full-articles/centre";

/**
 * Shared pieces of the knowledge centre pages (AP22 Welle 1): the night-blue page head with breadcrumbs, the
 * search field and the review state of an article. Server components only.
 */

export interface Crumb {
  href?: string;
  label: string;
}

/** Night-blue head band (Royal Imperial): breadcrumbs, eyebrow, Marcellus title, lead text. */
export function CentreHero({ crumbs, eyebrow, title, lead, children, testId }: { crumbs: Crumb[]; eyebrow?: ReactNode; title: ReactNode; lead?: ReactNode; children?: ReactNode; testId?: string }) {
  return (
    <section className="wz-hero border-b border-[#D4A537]/45" data-testid={testId}>
      <div className="mx-auto max-w-[46rem] px-5 pt-6 pb-10 sm:pt-8 sm:pb-12">
        <nav className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-white/75" aria-label="Brotkrumen">
          {crumbs.map((c, i) => (
            <span key={`${c.label}-${i}`} className="inline-flex items-center gap-2">
              {i > 0 && <span aria-hidden>›</span>}
              {c.href ? (
                <Link href={c.href} className="wz-text-link" data-testid={c.href === "/wissen/zentrum" ? "back-to-centre" : undefined}>
                  {c.label}
                </Link>
              ) : (
                <span aria-current="page">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
        {eyebrow && <p className="wz-eyebrow mt-7 sm:mt-9">{eyebrow}</p>}
        <h1 className="wz-serif mt-3 text-[2rem] leading-[1.15] sm:text-[2.5rem] text-white [text-wrap:pretty]">{title}</h1>
        <div className="wz-rule mt-5" aria-hidden />
        {lead && <p className="mt-5 text-[1.0625rem] sm:text-[1.125rem] leading-relaxed">{lead}</p>}
        {children}
      </div>
    </section>
  );
}

/** Search over titles, texts and sources of all articles. A plain GET form: works without JavaScript. */
export function CentreSearchForm({ query = "", className = "", onDark = false }: { query?: string; className?: string; onDark?: boolean }) {
  return (
    <form role="search" action="/wissen/zentrum/suche" method="get" className={`flex gap-2 ${className}`} data-testid="centre-search-form">
      <label htmlFor="wz-suche" className="sr-only">
        Wissenszentrum durchsuchen
      </label>
      <input
        id="wz-suche"
        type="search"
        name="q"
        defaultValue={query}
        placeholder="Suche in Titeln, Texten und Quellen, z. B. Ghusl, 4:11, Buḫārī"
        className={`min-h-[48px] w-full min-w-0 rounded-full border px-5 text-[1rem] outline-none focus-visible:ring-2 focus-visible:ring-[var(--wz-gold)] ${
          onDark ? "border-white/30 bg-white/95 text-[var(--wz-ink)] placeholder:text-[#5b6480]" : "border-[var(--wz-line)] bg-white text-[var(--wz-ink)] placeholder:text-[#5b6480]"
        }`}
        maxLength={120}
      />
      <button type="submit" className="wz-button wz-button-primary shrink-0 !bg-[var(--wz-gold)] !text-[var(--wz-green-dark)] hover:!bg-[#E0B64A]">
        <Search size={18} aria-hidden />
        <span>Suchen</span>
      </button>
    </form>
  );
}

/**
 * EA-05.6: three steps, the current one marked. "Fachlich geprüft" only with every review recorded for this version;
 * editorial source checks are listed as what they are, never as a release.
 */
export function ReviewState({ article, compact = false }: { article: FullArticle; compact?: boolean }) {
  const s = centreReviewState(article);
  const current = CENTRE_REVIEW_STAGES.findIndex((x) => x.stage === s.stage);
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
          s.stage === "geprueft" ? "bg-[#E6F2EA] text-[#1E5B35]" : "bg-[var(--wz-gold-soft)] text-[var(--wz-gold-text)]"
        }`}
        data-testid="review-state-badge"
        data-stage={s.stage}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden />
        {s.label}
        {s.stage !== "geprueft" && " · nicht fachlich geprüft"}
      </span>
    );
  }
  return (
    <section className="wz-card rounded-2xl p-5 sm:p-6 text-[0.95rem]" aria-labelledby="pruefstatus" data-testid="review-state" data-stage={s.stage}>
      <h2 id="pruefstatus" className="wz-serif text-[1.25rem] text-[var(--wz-green)]">
        Prüfstatus dieses Beitrags
      </h2>
      <ol className="mt-4 grid gap-2 sm:grid-cols-3" aria-label="Prüfstufen">
        {CENTRE_REVIEW_STAGES.map((x, i) => (
          <li
            key={x.stage}
            aria-current={i === current ? "step" : undefined}
            className={`rounded-xl border px-3 py-2 text-sm ${
              i === current ? "border-[var(--wz-gold)] bg-[var(--wz-gold-soft)] font-semibold text-[var(--wz-ink)]" : i < current ? "border-[var(--wz-line)] text-[var(--wz-ink)]" : "border-dashed border-[var(--wz-line)] text-[var(--wz-muted)]"
            }`}
          >
            <span className="block text-[0.7rem] uppercase tracking-[0.1em] text-[var(--wz-gold-text)]">Stufe {i + 1}</span>
            {x.label}
            {i === current && <span className="sr-only"> (aktueller Stand)</span>}
          </li>
        ))}
      </ol>
      <dl className="mt-4 space-y-2 text-[var(--wz-muted)]">
        <div>
          <dt className="inline font-semibold text-[var(--wz-ink)]">Fassung: </dt>
          <dd className="inline">Version {article.version}</dd>
        </div>
        {s.sourceTotal > 0 && (
          <div>
            <dt className="inline font-semibold text-[var(--wz-ink)]">Quellen ({s.sourceTotal}), redaktionell abgeglichen: </dt>
            <dd className="inline">{s.sources.map((x) => `${x.label}: ${x.count}`).join(" · ")}</dd>
          </div>
        )}
        <div>
          <dt className="inline font-semibold text-[var(--wz-ink)]">Noch offen: </dt>
          <dd className="inline">{s.openReviews.length ? s.openReviews.join(", ") : "nichts"}</dd>
        </div>
      </dl>
      <p className="mt-3 text-xs text-[var(--wz-muted)]">
        Der redaktionelle Quellenabgleich ist keine fachliche Freigabe. Als geprüft gilt ein Beitrag erst, wenn qualifizierte Fachpersonen ihre Prüfung dieser
        Fassung eingetragen haben.
      </p>
    </section>
  );
}
