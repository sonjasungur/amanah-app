import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { FULL_ARTICLES } from "@/modules/islamic-knowledge/full-articles";
import { articlesInRubric, getCentreArticle, getRubric } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { ArticleLink, anchor } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";

/** P2.7 knowledge centre, one rubric. Preview of unpublished drafts: 404 unless the preview switch is on. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

export default async function RubricPage({ params }: { params: Promise<{ nr: string }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const { nr } = await params;
  const rubric = getRubric(Number(nr));
  if (!rubric) notFound();
  const articles = articlesInRubric(rubric.nr);
  // Rubric 6: the questions of every FAQ, grouped by topic, each linking to its answer and sources.
  const faq = rubric.nr === 6 ? FULL_ARTICLES.flatMap((a) => (a.faq ?? []).map((f) => ({ ...f, articleId: a.id }))) : [];
  const topics = [...new Set(faq.map((f) => f.topic))];
  return (
    <div className="wz min-h-screen" data-testid="knowledge-rubric">
      <PreviewNote />
      <main className="mx-auto max-w-[46rem] px-5 pt-6 pb-16 sm:pt-10 space-y-10">
      <nav className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--wz-muted)]" aria-label="Brotkrumen">
        <Link href="/wissen/zentrum" className="wz-text-link">
          Wissenszentrum
        </Link>
        <span aria-hidden>›</span>
        <span>Rubrik {rubric.nr}</span>
      </nav>
      <header className="space-y-3">
        <p className="wz-eyebrow">Rubrik {rubric.nr}</p>
        <h1 className="wz-serif text-[2rem] leading-[1.15] sm:text-[2.5rem] font-semibold text-[var(--wz-green)]">{rubric.title}</h1>
        <p className="text-[1.125rem] text-[var(--wz-muted)]">{rubric.description}</p>
      </header>
      <section className="space-y-3" data-testid="rubric-articles">
        {articles.map((a) => (
          <ArticleLink key={a.id} a={a} />
        ))}
        {articles.length === 0 && <p className="text-[var(--wz-muted)]">In dieser Rubrik gibt es noch keine Beiträge.</p>}
      </section>
      {topics.length > 0 && (
        <section className="space-y-6" data-testid="faq-by-topic">
          <h2 className="wz-serif text-[1.6rem] font-semibold text-[var(--wz-green)]">Häufige Fragen nach Thema</h2>
          {topics.map((t) => (
            <div key={t} className="space-y-3">
              <h3 className="wz-eyebrow">{t}</h3>
              {faq
                .filter((f) => f.topic === t)
                .map((f) => (
                  <details key={f.question} className="wz-card rounded-2xl p-4 sm:p-5" data-testid="faq-entry">
                    <summary className="font-semibold cursor-pointer text-[var(--wz-green)]">{f.question}</summary>
                    <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[var(--wz-gold-text)] mt-3">Antwort – Zusammenfassung der Redaktion</p>
                    <p className="mt-1">{f.answer}</p>
                    <p className="text-sm mt-3 flex flex-wrap gap-x-3 gap-y-1">
                      {f.refs.map((r) => (
                        <Link key={r} href={`/wissen/zentrum/artikel/${f.articleId}#${anchor(r)}`} className="wz-text-link">
                          Beleg {r}
                        </Link>
                      ))}
                      {f.relatedArticleIds.map((id) => {
                        const a = getCentreArticle(id);
                        return a ? (
                          <Link key={id} href={`/wissen/zentrum/artikel/${id}`} className="wz-text-link">
                            {a.readerQuestion ?? a.title}
                          </Link>
                        ) : null;
                      })}
                    </p>
                  </details>
                ))}
            </div>
          ))}
        </section>
      )}
      </main>
    </div>
  );
}
