import { getDeploymentEnv } from "@/lib/deployment-env";

/**
 * Search engine indexing (owner order 25.11.2026, AP4.4).
 *
 * Closed by default: every response carries `X-Robots-Tag: noindex, nofollow` and robots.txt disallows
 * everything, until the owner releases the public start with AMANAH_SEARCH_INDEXING=true on a
 * production deployment. Staging is never indexable, whatever the switch says.
 *
 * Private areas stay noindex even after the release. This is only an additional signal: the real
 * protection is the login (folder data comes only from authenticated API routes) and the closed
 * internal routes.
 */
export const NOINDEX_PATH_PREFIXES = [
  "/dashboard",
  "/api",
  "/kasse",
  "/konto",
  "/intern",
  "/brand-review",
  "/login",
  "/register",
  "/passwort-vergessen",
  "/passwort-zuruecksetzen",
  "/wissen/redaktion",
  // Knowledge centre: preview only until its separate release.
  "/wissen/zentrum",
] as const;

export const NOINDEX_VALUE = "noindex, nofollow";

export function isNoindexPath(pathname: string): boolean {
  return NOINDEX_PATH_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isSearchIndexingEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.NEXT_PUBLIC_AMANAH_ENVIRONMENT === "staging") return false;
  return getDeploymentEnv(env) === "production" && env.AMANAH_SEARCH_INDEXING === "true";
}

/** The X-Robots-Tag value for a path, or null when the page may be indexed. */
export function robotsHeaderFor(pathname: string, env: NodeJS.ProcessEnv = process.env): string | null {
  if (!isSearchIndexingEnabled(env) || isNoindexPath(pathname)) return NOINDEX_VALUE;
  return null;
}
