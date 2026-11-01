import { BRAND } from "@/lib/brand";
import type { KnowledgeArticleRecord } from "./types";
import { isPublishable, lastReviewDate } from "./workflow";

/**
 * Structured data for search engines. Only for articles that passed the publication gate: a draft
 * gets nothing, whichever page asks.
 */
export function articleJsonLd(article: KnowledgeArticleRecord, siteUrl: string) {
  if (!isPublishable(article)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.summary,
    url: `${siteUrl}/wissen/islam/${article.slug}`,
    inLanguage: "de",
    isAccessibleForFree: true,
    dateModified: lastReviewDate(article),
    publisher: { "@type": "Organization", name: BRAND.name },
  };
}

/** `<` cannot close the script tag this ends up in. */
export function serializeJsonLd(data: object): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
