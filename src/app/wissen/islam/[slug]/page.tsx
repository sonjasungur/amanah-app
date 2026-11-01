import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ArticleActions } from "@/components/islamic-knowledge/article-actions";
import { ArticlePrintSource } from "@/components/islamic-knowledge/article-print-source";
import { SourcesSection } from "@/components/knowledge/sources-section";
import { Disclaimer } from "@/components/ui/disclaimer";
import {
  allSourceIds,
  getKnowledgeArea,
  getPublishedArticleBySlug,
  getPublishedArticles,
  getRelatedPublished,
  lastReviewDate,
  serializeJsonLd,
  SUNNI_SCHOOL_LABELS,
  articleJsonLd,
} from "@/modules/islamic-knowledge";
import { getSiteUrl } from "@/lib/seo/site-url";

export function generateStaticParams() {
  return getPublishedArticles().map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) return { title: "Nicht gefunden — Mein Wille", robots: { index: false } };
  return {
    title: `${article.title} — Islamisches Wissen | Mein Wille`,
    description: article.summary,
    alternates: { canonical: `/wissen/islam/${article.slug}` },
    openGraph: { title: article.title, description: article.summary, type: "article" },
  };
}

const REVIEW_KIND_LABELS = { source: "Quellenprüfung", scholar: "Fachliche Prüfung", legal: "Juristische Prüfung" } as const;

export default async function IslamicKnowledgeArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getPublishedArticleBySlug(slug);
  if (!article) notFound();

  const area = getKnowledgeArea(article.area);
  const related = getRelatedPublished(article);
  const currentReviews = article.reviews.filter((r) => r.version === article.version);
  const jsonLd = articleJsonLd(article, getSiteUrl());
  const reviewedOn = new Date(lastReviewDate(article) ?? "").toLocaleDateString("de-DE");

  return (
    <article className="reading-content max-w-3xl mx-auto px-4 py-8 md:py-12 pb-24">
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }} />}
      <nav className="no-print mb-6">
        <Link href="/wissen" className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1 min-h-[44px]">
          <ArrowLeft size={16} aria-hidden /> Islamisches Wissen
        </Link>
      </nav>

      <p className="text-sm text-accent font-medium mb-2">Bereich {area.letter} · {area.title}</p>
      <h1 className="text-3xl font-bold text-primary mb-3">{article.title}</h1>
      <p className="text-lg text-muted mb-6">{article.summary}</p>
      <ArticleActions title={article.title} slug={article.slug} />

      <div className="mt-8 space-y-4 text-foreground leading-relaxed max-w-prose">
        {article.body.split(/\n\s*\n/).map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {article.differingOpinions && (
        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-primary mb-2">Unterschiedliche Auffassungen</h2>
          <p className="text-sm text-muted leading-relaxed">{article.differingOpinions}</p>
        </section>
      )}

      {article.schoolDifferences && article.schoolDifferences.length > 0 && (
        <section className="mt-8" data-testid="school-differences">
          <h2 className="font-semibold text-primary mb-3">Positionen der Rechtsschulen</h2>
          <div className="space-y-4">
            {article.schoolDifferences.map((d) => (
              <div key={d.question} className="rounded-xl border border-border bg-card p-4">
                <p className="font-medium mb-1">{d.question}</p>
                <p className="text-xs text-muted mb-2">
                  {d.kind === "agreement" ? "Übereinstimmung der vier sunnitischen Schulen" : "Unterschiedliche Auffassungen"}
                </p>
                <ul className="space-y-2 text-sm">
                  {d.positions.map((p) => (
                    <li key={p.schools.join("-")}>
                      <span className="font-semibold">{p.schools.map((sc) => SUNNI_SCHOOL_LABELS[sc]).join(", ")}:</span>{" "}
                      {p.position}
                      {p.reference && <span className="block text-xs text-muted">{p.reference}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      {article.germanLawNote && (
        <section className="mt-6 rounded-xl border border-accent/30 bg-sand p-5">
          <h2 className="font-semibold text-primary mb-2">Deutsches Recht (getrennt von der islamischen Lehre)</h2>
          <p className="text-sm text-muted leading-relaxed">{article.germanLawNote}</p>
        </section>
      )}

      <SourcesSection sourceIds={allSourceIds(article)} reviewStatus="reviewed" defaultCollapsed={false} />

      <section className="mt-8 text-sm text-muted" data-testid="article-reviews">
        <h2 className="font-semibold text-foreground mb-2">Fachliche Prüfung</h2>
        <ul className="space-y-1">
          {currentReviews.map((r) => (
            <li key={`${r.kind}-${r.reviewedAt}`}>
              {REVIEW_KIND_LABELS[r.kind]}: {r.reviewer} · {new Date(r.reviewedAt).toLocaleDateString("de-DE")}
            </li>
          ))}
        </ul>
        <p className="mt-2">Version {article.version} · zuletzt überprüft am {reviewedOn}</p>
      </section>

      {related.length > 0 && (
        <section className="no-print mt-10">
          <h2 className="font-semibold text-primary mb-3">Verwandte Artikel</h2>
          <ul className="space-y-1">
            {related.map((r) => (
              <li key={r.id}>
                <Link href={`/wissen/islam/${r.slug}`} className="text-primary hover:underline">{r.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-10">
        <Disclaimer type="islamic" />
      </div>
      <ArticlePrintSource url={`${getSiteUrl()}/wissen/islam/${article.slug}`} status={`Version ${article.version}, zuletzt überprüft am ${reviewedOn}`} />
    </article>
  );
}
