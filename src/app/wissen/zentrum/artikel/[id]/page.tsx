import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { getCentreArticle, getRubric, relatedFatwaAnswers } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { ArrowLeft } from "lucide-react";
import { ArticleBody, OpenQuestions, SourceList, anchor } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";

/** P2.7 knowledge centre, one article. Preview of unpublished drafts: 404 unless the preview switch is on. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

export default async function CentreArticlePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const { id } = await params;
  const article = getCentreArticle(id);
  if (!article) notFound();
  const rubric = article.rubric ? getRubric(article.rubric) : undefined;
  return (
    <div className="wz min-h-screen" data-testid="centre-article" lang="de">
      {/* Same reading surface as the sample article 3:185: light paper, one text width, gold only as accent. */}
      <PreviewNote />
      <main className="px-5 pt-6 pb-16 sm:pt-10">
        <div className="mx-auto max-w-[46rem]">
          <nav className="text-sm flex flex-wrap items-center gap-x-2 gap-y-1 text-[var(--wz-muted)]" aria-label="Brotkrumen">
            <Link href="/wissen" className="wz-text-link">
              Islamisches Wissen
            </Link>
            <span aria-hidden>›</span>
            <Link href="/wissen/zentrum" className="wz-text-link">
              Wissenszentrum
            </Link>
            {rubric && (
              <>
                <span aria-hidden>›</span>
                <Link href={`/wissen/zentrum/rubrik/${rubric.nr}`} className="wz-text-link">
                  {rubric.title}
                </Link>
              </>
            )}
          </nav>
          <header className="mt-8 sm:mt-10 space-y-3">
            {rubric && <p className="wz-eyebrow">Rubrik {rubric.nr} · {rubric.title}</p>}
            <h1 className="wz-serif text-[2rem] leading-[1.15] sm:text-[2.5rem] font-semibold text-[var(--wz-green)] [text-wrap:pretty]">
              {article.readerQuestion ?? article.title}
            </h1>
            <p className="text-[1.125rem] text-[var(--wz-muted)] leading-relaxed">{article.summary}</p>
            <p className="text-sm text-[var(--wz-muted)] flex items-center gap-2">
              <span className="wz-rule" aria-hidden />
              Entwurf, Version {article.version} · fachliche Prüfung offen
            </p>
          </header>
        </div>

        <div className="mx-auto max-w-[46rem] mt-10 sm:mt-12 space-y-12">
          <ArticleBody article={article} />
          {article.differingOpinions && (
            <section className="wz-card rounded-2xl p-5 sm:p-6" data-testid="differing-opinions">
              <h2 className="wz-serif text-[1.35rem] font-semibold text-[var(--wz-green)] mb-2">Unterschiedliche Auffassungen im Überblick</h2>
              <p>{article.differingOpinions}</p>
            </section>
          )}
          {(() => {
            const fatwas = relatedFatwaAnswers(article.id);
            return fatwas.length > 0 ? (
              <section className="wz-card rounded-2xl p-5 sm:p-6 space-y-3 border-l-4 !border-l-[var(--wz-gold)]" data-testid="related-fatwas">
                <h2 className="wz-serif text-[1.35rem] font-semibold text-[var(--wz-green)]">Fatwas und Gelehrtenantworten zu diesem Thema</h2>
                <ul className="space-y-2">
                  {fatwas.map((f) => (
                    <li key={f.question}>
                      <Link href={`/wissen/zentrum/artikel/${f.articleId}#${anchor(f.refs.find((r) => r.startsWith("F-")) ?? f.refs[0] ?? "")}`} className="wz-text-link">
                        {f.question}
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null;
          })()}
          {(article.relatedArticles ?? []).length > 0 && (
            <section className="space-y-3" data-testid="related-articles">
              <h2 className="wz-serif text-[1.35rem] font-semibold text-[var(--wz-green)]">Weiterlesen</h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {(article.relatedArticles ?? []).map((id) => {
                  const r = getCentreArticle(id);
                  return r ? (
                    <li key={id}>
                      <Link href={`/wissen/zentrum/artikel/${id}`} className="wz-card wz-card-link block h-full rounded-2xl p-4 font-semibold text-[var(--wz-green)]">
                        {r.readerQuestion ?? r.title}
                      </Link>
                    </li>
                  ) : null;
                })}
              </ul>
            </section>
          )}
          <hr className="wz-hairline" />
          <SourceList article={article} />
          <OpenQuestions article={article} />
          <nav className="flex flex-wrap justify-between gap-3" aria-label="Weiter">
            <Link href={rubric ? `/wissen/zentrum/rubrik/${rubric.nr}` : "/wissen/zentrum"} className="wz-button wz-button-ghost">
              <ArrowLeft size={16} aria-hidden /> {rubric ? `Zur Rubrik ${rubric.title}` : "Zum Wissenszentrum"}
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
