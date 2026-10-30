import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { getPublishedArticles, lastReviewDate } from "@/modules/islamic-knowledge";

const PUBLIC_PAGES = ["/", "/wissen", "/check", "/preise", "/akuter-todesfall", "/datenschutz", "/impressum", "/sicherheit"];

/** Only public pages and reviewed, published knowledge articles — never drafts. */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  return [
    ...PUBLIC_PAGES.map((path) => ({ url: `${base}${path}`, changeFrequency: "monthly" as const })),
    ...getPublishedArticles().map((a) => ({
      url: `${base}/wissen/islam/${a.slug}`,
      lastModified: lastReviewDate(a),
      changeFrequency: "monthly" as const,
    })),
  ];
}
