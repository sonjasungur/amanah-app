import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { PUBLIC_PAGES } from "@/lib/seo/public-pages";
import { getPublicWissenTopics } from "@/lib/knowledge/wissen-topics";
import { getPublishedArticles, lastReviewDate } from "@/modules/islamic-knowledge";

/** Public pages and reviewed, published knowledge texts only — never drafts, never private areas. */
export function sitemapEntries(base: string = getSiteUrl()): MetadataRoute.Sitemap {
  return [
    ...Object.keys(PUBLIC_PAGES).map((path) => ({ url: path === "/" ? base : `${base}${path}`, changeFrequency: "monthly" as const })),
    ...getPublicWissenTopics().map((t) => ({ url: `${base}/wissen/${t.slug}`, changeFrequency: "monthly" as const })),
    ...getPublishedArticles().map((a) => ({
      url: `${base}/wissen/islam/${a.slug}`,
      lastModified: lastReviewDate(a),
      changeFrequency: "monthly" as const,
    })),
  ];
}
