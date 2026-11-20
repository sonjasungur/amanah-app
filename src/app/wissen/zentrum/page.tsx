import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { ENTRY_ARTICLE } from "@/modules/islamic-knowledge/full-articles";
import { RUBRICS, articlesInRubric, getCentreArticle } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { ArticleBody, DraftBanner, OpenQuestions, SourceList } from "@/components/knowledge/zentrum/article-view";

/** P2.7 knowledge centre, entry page. Preview of unpublished drafts: 404 unless the preview switch is on. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Amanah – Mein Wille", robots: { index: false, follow: false } };

export default function KnowledgeCentrePage() {
  if (!isKnowledgePreviewEnabled()) notFound();
  const entry = ENTRY_ARTICLE;
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-10" data-testid="knowledge-centre">
      <DraftBanner />
      <header className="space-y-2">
        <p className="text-sm font-semibold text-emerald">Islamisches Wissenszentrum · kostenlos, ohne Anmeldung, als Ṣadaqa Ǧāriya gedacht</p>
        <h1 className="text-3xl font-bold text-primary-dark">{entry?.readerQuestion ?? "Was passiert, wenn ich in Deutschland nichts geregelt habe?"}</h1>
        {entry?.summary && <p className="text-lg text-muted">{entry.summary}</p>}
      </header>

      {entry && <ArticleBody article={entry} />}

      {entry?.topics && entry.topics.length > 0 && (
        <section className="space-y-4" data-testid="entry-topics">
          <h2 className="text-xl font-bold text-primary-dark">Was ohne Regelung passiert – und dein nächster Schritt</h2>
          {entry.topics.map((t) => (
            <div key={t.title} className="rounded-xl border border-border p-4 space-y-2">
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm">
                <span className="font-semibold">Ohne Regelung: </span>
                {t.withoutRegulation}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Nächster Schritt: </span>
                {t.nextStep}
              </p>
              <p className="text-xs flex flex-wrap gap-x-3 gap-y-1">
                <Link href={`/wissen/zentrum/rubrik/${t.rubric}`} className="text-primary underline">
                  Rubrik {t.rubric}
                </Link>
                {t.articleIds.map((id) => {
                  const a = getCentreArticle(id);
                  return a ? (
                    <Link key={id} href={`/wissen/zentrum/artikel/${id}`} className="text-primary underline">
                      {a.readerQuestion ?? a.title}
                    </Link>
                  ) : null;
                })}
              </p>
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3" aria-labelledby="rubriken" data-testid="rubric-list">
        <h2 id="rubriken" className="text-xl font-bold text-primary-dark">
          Die sechs Rubriken
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {RUBRICS.map((r) => (
            <Link key={r.nr} href={`/wissen/zentrum/rubrik/${r.nr}`} className="rounded-xl border border-border p-4 hover:border-primary/50" data-testid="rubric-link">
              <span className="text-xs font-semibold text-muted">Rubrik {r.nr}</span>
              <span className="block font-semibold text-primary-dark">{r.title}</span>
              <span className="block text-sm text-muted mt-1">{r.description}</span>
              <span className="block text-xs text-muted mt-2">{articlesInRubric(r.nr).length} Beiträge</span>
            </Link>
          ))}
        </div>
      </section>

      {entry && (
        <>
          <SourceList article={entry} />
          <OpenQuestions article={entry} />
        </>
      )}
    </main>
  );
}
