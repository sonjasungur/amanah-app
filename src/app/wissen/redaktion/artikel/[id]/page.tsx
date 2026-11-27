import Link from "next/link";
import { notFound } from "next/navigation";
import { isEditorialPreviewEnabled } from "@/lib/flags/knowledge-preview";
import { getKnowledgeArea } from "@/modules/islamic-knowledge";
import {
  HADITH_COLLECTION_LABELS,
  PARAGRAPH_KIND_LABELS,
  SOURCE_LEVEL_LABELS,
  allSources,
  fullArticleIssues,
  getFullArticle,
  manualChecks,
  paragraphReview,
  requiredFullArticleReviews,
  type FullArticle,
  type SourceStatus,
} from "@/modules/islamic-knowledge/full-articles";
import { OwnerReviewSummary, OwnerSourceCheck } from "@/components/knowledge/owner-review";

export const metadata = { title: "Artikelentwurf prüfen — intern", robots: { index: false, follow: false } };

const COLLECTION = HADITH_COLLECTION_LABELS;
const REVIEW = { source: "Quellenprüfung", scholar: "Prüfung durch islamische Fachperson", legal: "Juristische Prüfung" } as const;
const FOR = { gelehrte: "An Gelehrte", jurist: "An Juristen", redaktion: "An die Redaktion" } as const;
const KIND_TONE: Record<string, string> = {
  quran: "border-emerald-700 bg-emerald-50",
  hadith: "border-sky-700 bg-sky-50",
  tafsir: "border-amber-700 bg-amber-50",
  kontext: "border-sky-400",
  fiqh: "border-violet-600 bg-violet-50",
  recht: "border-red-700 bg-red-50",
};

function Status({ status, testId }: { status: SourceStatus; testId?: string }) {
  return (
    <p className="text-xs mt-1" data-testid={testId}>
      <span className="font-semibold">{SOURCE_LEVEL_LABELS[status.level]}</span> · {status.by}, {status.checkedAt} · Fachliche Freigabe: offen
      <span className="block text-muted">Prüfweg: {status.method}</span>
    </p>
  );
}

function SourceList({ a }: { a: FullArticle }) {
  return (
    <div className="space-y-3">
      {a.sources.quran.map((q) => (
        <div key={q.ref} id={`src-${q.ref}`} className="rounded-xl border border-border p-3 scroll-mt-20" data-testid="source-card">
          <p className="text-xs font-semibold text-muted">
            [{q.ref}] Qur’an, Sure {q.surah}, Vers {q.ayah} · {q.edition}
          </p>
          {q.arabic && (
            <p dir="rtl" lang="ar" className="text-xl mt-2" style={{ fontFamily: "var(--font-arabic), serif" }}>
              {q.arabic}
            </p>
          )}
          <blockquote className="mt-2 border-l-4 border-emerald-700/40 pl-3">{q.germanVerbatim}</blockquote>
          <a href={q.url} className="text-xs text-primary underline" rel="noreferrer">
            {q.url}
          </a>
          <Status status={q.status} />
          <OwnerSourceCheck articleId={a.id} sourceRef={q.ref} />
        </div>
      ))}
      {a.sources.tafsir.map((t) => (
        <div key={t.ref} id={`src-${t.ref}`} className="rounded-xl border border-border p-3 scroll-mt-20" data-testid="source-card">
          <p className="text-xs font-semibold text-muted">
            [{t.ref}] {t.edition}
          </p>
          <p className="text-xs" data-testid="tafsir-locator">
            Fundstelle: {t.locator} · Gelesen: {t.readExtent}
            {t.printLocator ? (
              <>
                {" · "}
                <a href={t.printLocator.digitalCopy} className="text-primary underline" rel="noreferrer">
                  Digitalisat der Seite
                </a>
              </>
            ) : null}
          </p>
          <p className="mt-1">{t.summary}</p>
          <a href={t.url} className="text-xs text-primary underline" rel="noreferrer">
            {t.url}
          </a>
          <Status status={t.status} />
          <OwnerSourceCheck articleId={a.id} sourceRef={t.ref} />
        </div>
      ))}
      {a.sources.hadith.map((h) => (
        <div key={h.ref} id={`src-${h.ref}`} className="rounded-xl border border-border p-3 scroll-mt-20" data-testid="source-card">
          <p className="text-xs font-semibold text-muted">
            [{h.ref}] {COLLECTION[h.collection]} Nr. {h.number} · Erzähler: {h.narrator}
            {h.numberingNote ? ` · ${h.numberingNote}` : ""}
          </p>
          {h.arabicExcerpt && (
            <p dir="rtl" lang="ar" className="text-lg mt-1" style={{ fontFamily: "var(--font-arabic), serif" }}>
              {h.arabicExcerpt}
            </p>
          )}
          {h.germanRendering && <p className="mt-1 italic">{h.germanRendering}</p>}
          <p className="mt-1">{h.summary}</p>
          {(h.grading ?? []).length > 0 && (
            <p className="text-xs mt-1" data-testid="hadith-grading">
              Einstufung: {(h.grading ?? []).map((g) => `${g.by}: ${g.grade}`).join(" · ")}
            </p>
          )}
          <p className="text-xs">
            <a href={h.sunnahComUrl} className="text-primary underline" rel="noreferrer">
              {h.sunnahComUrl}
            </a>
            {h.mirrorUrl ? (
              <>
                {" · "}
                <a href={h.mirrorUrl} className="text-primary underline" rel="noreferrer">
                  Spiegel
                </a>
              </>
            ) : null}
          </p>
          <Status status={h.status} />
          <OwnerSourceCheck articleId={a.id} sourceRef={h.ref} />
        </div>
      ))}
      {(a.sources.fatwa ?? []).map((f) => (
        <div key={f.ref} id={`src-${f.ref}`} className="rounded-xl border border-border p-3 scroll-mt-20" data-testid="source-card">
          <p className="text-xs font-semibold text-muted">
            [{f.ref}] {f.author} · {f.work} · {f.locator}
            {f.date ? ` · ${f.date}` : ""}
          </p>
          <p className="mt-1 text-sm">Frage: {f.question}</p>
          {f.arabicExcerpt && (
            <p dir="rtl" lang="ar" className="text-lg mt-1" style={{ fontFamily: "var(--font-arabic), serif" }}>
              {f.arabicExcerpt}
            </p>
          )}
          <p className="mt-1">{f.summary}</p>
          <a href={f.url} className="text-xs text-primary underline" rel="noreferrer">
            {f.url}
          </a>
          <Status status={f.status} />
          <OwnerSourceCheck articleId={a.id} sourceRef={f.ref} />
        </div>
      ))}
      {a.sources.law.map((l) => (
        <div key={l.ref} id={`src-${l.ref}`} className="rounded-xl border border-border p-3 scroll-mt-20" data-testid="source-card">
          <p className="text-xs font-semibold text-muted">
            [{l.ref}] {l.title} · {l.jurisdiction} · abgerufen {l.retrievedAt}
          </p>
          <a href={l.url} className="text-xs text-primary underline" rel="noreferrer">
            {l.url}
          </a>
          <Status status={l.status} />
          <OwnerSourceCheck articleId={a.id} sourceRef={l.ref} />
        </div>
      ))}
    </div>
  );
}

/**
 * One draft for reading and source checking. Each paragraph shows its kind and links to its sources,
 * which are listed with edition, locator, link and review state. Printable as review material.
 */
export default async function FullArticleReviewPage({ params }: { params: Promise<{ id: string }> }) {
  if (!isEditorialPreviewEnabled()) notFound();
  const { id } = await params;
  const a = getFullArticle(id);
  if (!a) notFound();
  const area = getKnowledgeArea(a.area);
  const issues = fullArticleIssues(a);
  const byFor = (f: keyof typeof FOR) => a.openQuestions.filter((q) => q.for === f);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8 leading-relaxed print:px-0" lang="de">
      <p className="rounded-xl border-2 border-warning/50 bg-warning/10 p-3 text-sm font-semibold" data-testid="draft-banner">
        Entwurf – ungeprüft, nicht veröffentlicht. Keine Fatwa und keine Rechtsberatung. Nur zur Prüfung.
      </p>
      <p className="text-xs text-muted mt-4 print:hidden">
        <Link href="/wissen/redaktion/artikel" className="underline">
          Alle Artikel
        </Link>{" "}
        · Bereich {area.letter} ({area.title}) · {a.id} · Version {a.version} · Status: Entwurf
      </p>
      <h1 className="text-3xl font-bold text-primary mt-2">{a.title}</h1>
      <p className="text-lg text-muted mt-2">{a.summary}</p>
      <p className="text-xs mt-2">
        <OwnerReviewSummary articleId={a.id} refs={allSources(a).map((s) => s.ref)} /> · Erforderlich: {requiredFullArticleReviews(a).map((k) => REVIEW[k]).join(", ")} · Erfasst:{" "}
        {a.reviews.length ? a.reviews.map((r) => `${REVIEW[r.kind]} (${r.reviewer}, ${r.reviewedAt})`).join("; ") : "keine"}
      </p>
      <p className="text-xs text-muted mt-1 print:hidden">Zum Exportieren als Prüfunterlage: drucken bzw. „Als PDF speichern“.</p>

      {a.sections.map((s, i) => (
        <section key={`${s.key}-${i}`} className="mt-8 break-inside-auto" aria-labelledby={`sec-${i}`}>
          <h2 id={`sec-${i}`} className="text-xl font-bold text-primary border-b border-border pb-1 mb-3">
            {s.title}
          </h2>
          {s.paragraphs.map((p, j) => (
            <div key={j} className={`mb-3 border-l-4 pl-3 ${KIND_TONE[p.kind] ?? "border-border"}`} data-kind={p.kind} data-testid="review-paragraph">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {PARAGRAPH_KIND_LABELS[p.kind]}
                {(p.refs ?? []).length > 0 && (
                  <>
                    {" · "}
                    {(p.refs ?? []).map((r, k) => (
                      <span key={r}>
                        {k > 0 && ", "}
                        <a href={`#src-${r}`} className="underline normal-case">
                          {r}
                        </a>
                      </span>
                    ))}
                  </>
                )}
              </p>
              <p className="whitespace-pre-wrap">{p.text}</p>
              {(() => {
                const r = paragraphReview(a, p);
                return (
                  <p
                    className={`mt-1 text-[11px] ${r.contentChecked ? "text-muted" : "font-semibold text-amber-900"}`}
                    data-testid="paragraph-review"
                    data-checked={r.contentChecked ? "true" : "false"}
                  >
                    {r.contentChecked ? "✓" : "⚠"} {r.label} · {r.detail}
                  </p>
                );
              })()}
              {(p.seeAlso ?? []).length > 0 && (
                <p className="text-[11px] text-muted">
                  Siehe auch (eigene Quellenart, gesondert geprüft):{" "}
                  {(p.seeAlso ?? []).map((r, k) => (
                    <span key={r}>
                      {k > 0 && ", "}
                      <a href={`#src-${r}`} className="underline">
                        {r}
                      </a>
                    </span>
                  ))}
                </p>
              )}
            </div>
          ))}
        </section>
      ))}

      {a.differingOpinions.trim() && (
        <section className="mt-8">
          <h2 className="text-xl font-bold text-primary border-b border-border pb-1 mb-3">Unterschiedliche Auffassungen (Zusammenfassung)</h2>
          <p className="whitespace-pre-wrap">{a.differingOpinions}</p>
        </section>
      )}

      <section className="mt-10" data-testid="source-list">
        <h2 className="text-xl font-bold text-primary border-b border-border pb-1 mb-3">Quellenverzeichnis und Prüfstand</h2>
        <SourceList a={a} />
      </section>

      <section className="mt-10" data-testid="open-questions">
        <h2 className="text-xl font-bold text-primary border-b border-border pb-1 mb-3">Offene Fragen ({a.openQuestions.length})</h2>
        {(Object.keys(FOR) as (keyof typeof FOR)[]).map((f) =>
          byFor(f).length ? (
            <div key={f} className="mb-3">
              <p className="font-semibold">{FOR[f]}</p>
              <ol className="list-decimal pl-5">
                {byFor(f).map((q) => (
                  <li key={q.question}>
                    {q.question}
                    {(q.refs ?? []).length ? <span className="text-xs text-muted"> ({(q.refs ?? []).join(", ")})</span> : null}
                  </li>
                ))}
              </ol>
            </div>
          ) : null,
        )}
        <p className="font-semibold mt-4">Von Hand zu prüfen</p>
        <ul className="list-disc pl-5" data-testid="manual-checks">
          {manualChecks(a).map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ul>
        {issues.length > 0 && (
          <>
            <p className="font-semibold mt-4 text-danger">Strukturhinweise</p>
            <ul className="list-disc pl-5 text-danger">
              {issues.map((c) => (
                <li key={c}>{c}</li>
              ))}
            </ul>
          </>
        )}
        {a.replacesExisting.length > 0 && (
          <p className="text-sm text-muted mt-4">Bündelt bestehende Einträge: {a.replacesExisting.join(", ")} (diese bleiben unverändert, bis die Redaktion entscheidet).</p>
        )}
      </section>
    </article>
  );
}
