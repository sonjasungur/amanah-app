/**
 * Owner order 25.11.2026: production stays closed to search engines until the public start, private
 * areas are never indexable, public pages carry title/description/canonical, and the app is called
 * Wasiyya everywhere (the Islamic term "Amanah" for entrusted goods stays).
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { NOINDEX_PATH_PREFIXES, isNoindexPath, isSearchIndexingEnabled, robotsHeaderFor } from "@/lib/seo/indexing";
import { PUBLIC_PAGES, publicPageMetadata } from "@/lib/seo/public-pages";
import { sitemapEntries } from "@/lib/seo/sitemap-entries";
import { organizationJsonLd } from "@/components/seo/organization-json-ld";
import { IMPRINT } from "@/lib/legal/imprint";

const env = (e: Record<string, string>) => e as unknown as NodeJS.ProcessEnv;
const PROD_OPEN = env({ NODE_ENV: "production", AMANAH_SEARCH_INDEXING: "true" });

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("indexing switch", () => {
  it("is closed unless production explicitly opens it; staging never", () => {
    expect(isSearchIndexingEnabled(env({ NODE_ENV: "production" }))).toBe(false);
    expect(isSearchIndexingEnabled(env({ NODE_ENV: "production", AMANAH_SEARCH_INDEXING: "1" }))).toBe(false);
    expect(isSearchIndexingEnabled(PROD_OPEN)).toBe(true);
    expect(isSearchIndexingEnabled(env({ NODE_ENV: "production", AMANAH_SEARCH_INDEXING: "true", AMANAH_DEPLOYMENT_ENV: "staging" }))).toBe(false);
    expect(isSearchIndexingEnabled(env({ NODE_ENV: "production", AMANAH_SEARCH_INDEXING: "true", NEXT_PUBLIC_AMANAH_ENVIRONMENT: "staging" }))).toBe(false);
    expect(isSearchIndexingEnabled(env({ NODE_ENV: "development", AMANAH_SEARCH_INDEXING: "true" }))).toBe(false);
  });

  it("marks every page noindex while closed, and private areas always", () => {
    expect(robotsHeaderFor("/", env({ NODE_ENV: "production" }))).toBe("noindex, nofollow");
    expect(robotsHeaderFor("/", PROD_OPEN)).toBeNull();
    expect(robotsHeaderFor("/wissen/janazah-wuensche", PROD_OPEN)).toBeNull();
    for (const p of ["/dashboard", "/dashboard/testament", "/dashboard/pdf", "/api/amanah", "/kasse/ergebnis", "/konto/bestaetigen", "/login", "/register", "/intern/pruefworkflow", "/wissen/redaktion/artikel/1", "/wissen/zentrum", "/brand-review", "/passwort-zuruecksetzen"]) {
      expect(robotsHeaderFor(p, PROD_OPEN), p).toBe("noindex, nofollow");
    }
    expect(isNoindexPath("/dashboardx")).toBe(false);
  });

  it("no public page lies inside a private area", () => {
    for (const path of Object.keys(PUBLIC_PAGES)) expect(isNoindexPath(path), path).toBe(false);
    for (const e of sitemapEntries("https://wasiyya.de")) expect(isNoindexPath(new URL(e.url).pathname), e.url).toBe(false);
  });

  it("robots.txt and sitemap follow the runtime switch", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("AMANAH_SEARCH_INDEXING", "");
    let robots = (await import("@/app/robots")).default();
    expect(robots.rules).toEqual({ userAgent: "*", disallow: "/" });
    expect((await import("@/app/sitemap")).default()).toEqual([]);

    vi.resetModules();
    vi.stubEnv("AMANAH_SEARCH_INDEXING", "true");
    robots = (await import("@/app/robots")).default();
    const rules = robots.rules as { disallow: string[] };
    for (const prefix of NOINDEX_PATH_PREFIXES) expect(rules.disallow.some((d) => d.startsWith(prefix))).toBe(true);
    expect((await import("@/app/sitemap")).default().length).toBeGreaterThan(Object.keys(PUBLIC_PAGES).length - 1);
  });

  it("the proxy sets the header at request time and covers all pages", () => {
    const proxy = readFileSync("src/proxy.ts", "utf8");
    expect(proxy).toContain("robotsHeaderFor(request.nextUrl.pathname)");
    expect(proxy).toContain('matcher: ["/((?!_next/static|_next/image).*)"]');
    for (const f of ["src/app/robots.ts", "src/app/sitemap.ts"]) expect(readFileSync(f, "utf8")).toContain('export const dynamic = "force-dynamic"');
  });
});

describe("public page metadata", () => {
  it("every public page has a title, a description of useful length and a canonical path", () => {
    for (const [path, page] of Object.entries(PUBLIC_PAGES)) {
      expect(page.title, path).toMatch(/Wasiyya/);
      expect(page.description.length, path).toBeGreaterThanOrEqual(50);
      expect(page.description.length, path).toBeLessThanOrEqual(170);
      const meta = publicPageMetadata(path as keyof typeof PUBLIC_PAGES);
      expect(meta.alternates?.canonical).toBe(path);
    }
    const titles = Object.values(PUBLIC_PAGES).map((p) => p.title);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("each listed public page actually uses its entry, and private layouts are noindex", () => {
    for (const path of Object.keys(PUBLIC_PAGES)) {
      const dir = path === "/" ? "src/app" : `src/app${path}`;
      const files = [`${dir}/page.tsx`, `${dir}/layout.tsx`].filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
      expect(files, path).toContain(`publicPageMetadata("${path}")`);
    }
    for (const f of ["src/app/dashboard/layout.tsx", "src/app/kasse/layout.tsx", "src/app/login/page.tsx", "src/app/register/page.tsx"]) {
      expect(readFileSync(f, "utf8"), f).toContain("robots: { index: false, follow: false }");
    }
  });

  it("the root layout sets the base URL, and the approved preview image is used", () => {
    const layout = readFileSync("src/app/layout.tsx", "utf8");
    expect(layout).toContain("metadataBase: new URL(getSiteUrl())");
    expect(layout).toContain('card: "summary_large_image"');
    for (const f of ["src/app/opengraph-image.png", "src/app/twitter-image.png", "src/app/opengraph-image.alt.txt"]) expect(existsSync(f), f).toBe(true);
  });

  it("structured data names only the operator from the imprint, no ratings or reviewers", () => {
    const data = JSON.stringify(organizationJsonLd("https://wasiyya.de"));
    expect(data).toContain(IMPRINT.operatorLegalName);
    expect(data).toContain('"addressCountry":"DE"');
    expect(data).not.toMatch(/aggregateRating|review|author|reviewedBy|award/i);
  });
});

describe("branding", () => {
  const ARTICLE_DIR = "src/modules/islamic-knowledge/full-articles";
  const APP_NAME_AMANAH = /\b(in|In|von|zu|bei|mit) Amanah(?![A-Za-zĀ-ž&])|\bAmanah (ersetzt|ersetzen|gibt|soll|kann|prüft|berechnet|entscheidet|vermittelt|hilft|speichert)\b|Bezug zu(r Vorsorge in)? Amanah/;

  it("published knowledge texts call the app Wasiyya; the Islamic term Amanah stays", () => {
    for (const f of readdirSync(ARTICLE_DIR).filter((n) => /\.(json|ts)$/.test(n))) {
      const text = readFileSync(`${ARTICLE_DIR}/${f}`, "utf8");
      expect(text.match(APP_NAME_AMANAH)?.[0], f).toBeUndefined();
    }
    expect(readFileSync(`${ARTICLE_DIR}/p27-articles.json`, "utf8")).toContain("Vorsorge ist eine Amanah");
  });

  it("no unused framework placeholder graphics are published", () => {
    for (const f of ["next.svg", "vercel.svg", "file.svg", "globe.svg", "window.svg"]) expect(existsSync(`public/${f}`), f).toBe(false);
  });

  it("account mails name the operator and link the imprint on the public address", async () => {
    vi.stubEnv("AMANAH_PUBLIC_BASE_URL", "https://wasiyya.de");
    const { mailFooter } = await import("@/lib/server/account-recovery");
    expect(mailFooter()).toContain(`Wasiyya · ${IMPRINT.operatorLegalName}`);
    expect(mailFooter()).toContain("https://wasiyya.de/impressum");
  });
});
