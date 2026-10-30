/** Public site URL for absolute links in sitemap/robots (configured, never request-derived). */
export function getSiteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/+$/, "");
}
