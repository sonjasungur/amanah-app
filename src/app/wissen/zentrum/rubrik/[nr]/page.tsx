import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { FULL_ARTICLES } from "@/modules/islamic-knowledge/full-articles";
import { articlesInRubric, getCentreArticle, getRubric } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { ArticleLink, DraftBanner, anchor } from "@/components/knowledge/zentrum/article-view";

/** P2.7 knowledge centre, one rubric. Preview of unpublished drafts: 404 unless the preview switch is on. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Amanah – Mein Wille", robots: { index: false, follow: false } };

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
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8" data-testid="knowledge-rubric">
      <DraftBanner />
      <nav className="text-sm">
        <Link href="/wissen/zentrum" className="text-primary underline">
          Wissenszentrum
        </Link>{" "}
        › Rubrik {rubric.nr}
      </nav>
      <header className="space-y-2">
        <p className="text-sm font-semibold text-emerald">Rubrik {rubric.nr}</p>
        <h1 className="text-3xl font-bold text-primary-dark">{rubric.title}</h1>
        <p className="text-muted">{rubric.description}</p>
      </header>
      <section className="space-y-3" data-testid="rubric-articles">
        {articles.map((a) => (
          <ArticleLink key={a.id} a={a} />
        ))}
        {articles.length === 0 && <p className="text-muted">In dieser Rubrik gibt es noch keine Beiträge.</p>}
      </section>
      {topics.length > 0 && (
        <section className="space-y-6" data-testid="faq-by-topic">
          <h2 className="text-xl font-bold text-primary-dark">Häufige Fragen nach Thema</h2>
          {topics.map((t) => (
            <div key={t} className="space-y-3">
              <h3 className="font-semibold">{t}</h3>
              {faq
                .filter((f) => f.topic === t)
                .map((f) => (
                  <details key={f.question} className="rounded-xl border border-border p-4" data-testid="faq-entry">
                    <summary className="font-semibold cursor-pointer">{f.question}</summary>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted mt-2">Antwort – Zusammenfassung der Redaktion</p>
                    <p className="mt-1">{f.answer}</p>
                    <p className="text-xs mt-2 flex flex-wrap gap-x-3">
                      {f.refs.map((r) => (
                        <Link key={r} href={`/wissen/zentrum/artikel/${f.articleId}#${anchor(r)}`} className="text-primary underline">
                          Beleg {r}
                        </Link>
                      ))}
                      {f.relatedArticleIds.map((id) => {
                        const a = getCentreArticle(id);
                        return a ? (
                          <Link key={id} href={`/wissen/zentrum/artikel/${id}`} className="text-primary underline">
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
  );
}
