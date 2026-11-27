import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site-url";
import { NOINDEX_PATH_PREFIXES, isSearchIndexingEnabled } from "@/lib/seo/indexing";

/** Read at request time: indexing is a runtime switch of the deployment (owner order 25.11.2026). */
export const dynamic = "force-dynamic";

export default function robots(): MetadataRoute.Robots {
  if (!isSearchIndexingEnabled()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: NOINDEX_PATH_PREFIXES.map((p) => (p === "/api" ? "/api/" : p)) },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
