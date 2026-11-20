import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { getCentreArticle, getRubric, relatedFatwaAnswers } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { ArticleBody, DraftBanner, OpenQuestions, SourceList, anchor } from "@/components/knowledge/zentrum/article-view";

/** P2.7 knowledge centre, one article. Preview of unpublished drafts: 404 unless the preview switch is on. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Amanah – Mein Wille", robots: { index: false, follow: false } };

export default async function CentreArticlePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const { id } = await params;
  const article = getCentreArticle(id);
  if (!article) notFound();
  const rubric = article.rubric ? getRubric(article.rubric) : undefined;
  return (
    <main className="max-w-3xl mx-auto px-4 py-8 space-y-8" data-testid="centre-article" lang="de">
      <DraftBanner />
      <nav className="text-sm">
        <Link href="/wissen/zentrum" className="text-primary underline">
          Wissenszentrum
        </Link>
        {rubric && (
          <>
            {" › "}
            <Link href={`/wissen/zentrum/rubrik/${rubric.nr}`} className="text-primary underline">
              {rubric.title}
            </Link>
          </>
        )}
      </nav>
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary-dark">{article.readerQuestion ?? article.title}</h1>
        <p className="text-muted">{article.summary}</p>
        <p className="text-xs text-muted">Entwurf, Version {article.version} · fachliche Prüfung offen</p>
      </header>
      <ArticleBody article={article} />
      {article.differingOpinions && (
        <section className="rounded-xl border border-border p-4 text-sm" data-testid="differing-opinions">
          <h2 className="font-semibold mb-1">Unterschiedliche Auffassungen im Überblick</h2>
          <p>{article.differingOpinions}</p>
        </section>
      )}
      {(() => {
        const fatwas = relatedFatwaAnswers(article.id);
        return fatwas.length > 0 ? (
          <section className="rounded-xl border-2 border-amber-500/40 p-4 space-y-2" data-testid="related-fatwas">
            <h2 className="font-semibold">Fatwas und Gelehrtenantworten zu diesem Thema</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {fatwas.map((f) => (
                <li key={f.question}>
                  <Link href={`/wissen/zentrum/artikel/${f.articleId}#${anchor(f.refs.find((r) => r.startsWith("F-")) ?? f.refs[0] ?? "")}`} className="text-primary underline">
                    {f.question}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null;
      })()}
      {(article.relatedArticles ?? []).length > 0 && (
        <section className="rounded-xl border border-border p-4 space-y-2" data-testid="related-articles">
          <h2 className="font-semibold">Weiterlesen</h2>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {(article.relatedArticles ?? []).map((id) => {
              const r = getCentreArticle(id);
              return r ? (
                <li key={id}>
                  <Link href={`/wissen/zentrum/artikel/${id}`} className="text-primary underline">
                    {r.readerQuestion ?? r.title}
                  </Link>
                </li>
              ) : null;
            })}
          </ul>
        </section>
      )}
      <SourceList article={article} />
      <OpenQuestions article={article} />
    </main>
  );
}
