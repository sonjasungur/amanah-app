import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

// Checked as after the public start (AMANAH_SEARCH_INDEXING=true); closed mode: seo-and-branding.test.ts.
beforeEach(() => {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("AMANAH_SEARCH_INDEXING", "true");
});
afterEach(() => vi.unstubAllEnvs());
import { KNOWLEDGE_CATALOG } from "@/modules/islamic-knowledge";

describe("SEO surfaces", () => {
  it("sitemap lists no unpublished knowledge article", () => {
    const urls = sitemap().map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/wissen"))).toBe(true);
    for (const draft of KNOWLEDGE_CATALOG) expect(urls.some((u) => u.endsWith(`/wissen/islam/${draft.slug}`))).toBe(false);
  });

  it("robots keeps private and editorial areas out of the index", () => {
    const rules = robots().rules;
    const disallow = (Array.isArray(rules) ? rules[0] : rules).disallow as string[];
    for (const path of ["/dashboard", "/api/", "/wissen/redaktion", "/konto", "/kasse", "/login"]) expect(disallow).toContain(path);
  });
});
