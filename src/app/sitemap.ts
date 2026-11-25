import type { MetadataRoute } from "next";
import { isSearchIndexingEnabled } from "@/lib/seo/indexing";
import { sitemapEntries } from "@/lib/seo/sitemap-entries";

/** Read at request time: while indexing is closed (owner order 25.11.2026), the sitemap announces nothing. */
export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  return isSearchIndexingEnabled() ? sitemapEntries() : [];
}
