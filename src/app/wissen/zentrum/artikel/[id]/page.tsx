import Link from "next/link";
import { notFound } from "next/navigation";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { getCentreArticle, getRubric, relatedFatwaAnswers } from "@/modules/islamic-knowledge/full-articles/rubrics";
import { relatedTopics } from "@/modules/islamic-knowledge/full-articles/centre";
import { ArrowLeft } from "lucide-react";
import { ArticleBody, OpenQuestions, SourceList, anchor } from "@/components/knowledge/zentrum/article-view";
import { PreviewNote } from "@/components/knowledge/zentrum/preview-note";
import { CentreHero, CentreSearchForm, ReviewState } from "@/components/knowledge/zentrum/centre-ui";

/** P2.7 knowledge centre, one article. Preview of unpublished drafts: 404 unless the preview switch is on. */
export const dynamic = "force-dynamic";
export const metadata = { title: "Wissenszentrum (Vorschau) — Wasiyya", robots: { index: false, follow: false } };

export default async function CentreArticlePage({ params }: { params: Promise<{ id: string }> }) {
  if (!isKnowledgePreviewEnabled()) notFound();
  const { id } = await params;
  const article = getCentreArticle(id);
  if (!article) notFound();
  const rubric = article.rubric ? getRubric(article.rubric) : undefined;
  const fatwas = relatedFatwaAnswers(article.id);
  const related = relatedTopics(article);
  return (
    <div className="wz min-h-screen" data-testid="centre-article" lang="de">
      {/* Night-blue head, then a white reading column of about 70 characters; gold only as accent. */}
      <PreviewNote />
      <CentreHero
        crumbs={[
          { href: "/wissen/zentrum", label: "Islamisches Wissen" },
          ...(rubric ? [{ href: `/wissen/zentrum/rubrik/${rubric.nr}`, label: rubric.title }] : []),
        ]}
        eyebrow={rubric ? `Rubrik ${rubric.nr} · ${rubric.title}` : "Wissenszentrum"}
        title={article.readerQuestion ?? article.title}
        lead={article.summary}
      >
        <p className="mt-5 flex flex-wrap items-center gap-2 text-sm">
          <ReviewState article={article} compact />
          <a href="#pruefstatus" className="wz-text-link">
            Prüfstatus ansehen
          </a>
        </p>
      </CentreHero>

      <main className="px-5 pt-10 pb-16 sm:pt-12">
        <div className="wz-read space-y-12" data-testid="article-reading-column">
          <ArticleBody article={article} />
          {article.differingOpinions && (
            <section className="wz-card rounded-2xl p-5 sm:p-6" data-testid="differing-opinions">
              <h2 className="wz-serif text-[1.35rem] text-[var(--wz-green)] mb-2">Unterschiedliche Auffassungen im Überblick</h2>
              <p className="text-[0.75rem] font-semibold uppercase tracking-[0.1em] text-[var(--wz-gold-text)] mb-1.5">Zusammenfassung der Redaktion</p>
              <p>{article.differingOpinions}</p>
            </section>
          )}
          {fatwas.length > 0 && (
            <section className="wz-card rounded-2xl p-5 sm:p-6 space-y-3 border-l-4 !border-l-[var(--wz-gold)]" data-testid="related-fatwas">
              <h2 className="wz-serif text-[1.35rem] text-[var(--wz-green)]">Fatwas und Gelehrtenantworten zu diesem Thema</h2>
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
          )}
          {related.length > 0 && (
            <section className="space-y-3" aria-labelledby="verwandt" data-testid="related-articles">
              <h2 id="verwandt" className="wz-serif text-[1.35rem] text-[var(--wz-green)]">
                Verwandte Themen
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link href={`/wissen/zentrum/artikel/${r.id}`} className="wz-card wz-card-link block h-full rounded-2xl p-4" data-testid="related-article-link">
                      {r.rubric ? <span className="wz-eyebrow block text-[0.7rem]">{getRubric(r.rubric)?.title}</span> : null}
                      <span className="mt-1 block font-semibold text-[var(--wz-green)]">{r.readerQuestion ?? r.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <hr className="wz-hairline" />
          <SourceList article={article} />
          <ReviewState article={article} />
          <OpenQuestions article={article} />
          <section className="wz-card rounded-2xl p-5 sm:p-6 space-y-3" aria-label="Suche im Wissenszentrum">
            <p className="font-semibold text-[var(--wz-green)]">Weitere Fragen? Durchsuche alle Beiträge und ihre Quellen.</p>
            <CentreSearchForm />
          </section>
          <nav className="flex flex-wrap justify-between gap-3" aria-label="Weiter">
            <Link href={rubric ? `/wissen/zentrum/rubrik/${rubric.nr}` : "/wissen/zentrum"} className="wz-button wz-button-ghost">
              <ArrowLeft size={16} aria-hidden /> {rubric ? `Zur Rubrik ${rubric.title}` : "Zum Wissenszentrum"}
            </Link>
            <Link href="/wissen/zentrum" className="wz-button wz-button-ghost">
              Alle Rubriken
            </Link>
          </nav>
        </div>
      </main>
    </div>
  );
}
