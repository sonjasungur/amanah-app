import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import verbatim from "@/lib/knowledge/data/quran-verbatim.json";
import { KNOWLEDGE_AREAS, KNOWLEDGE_CATALOG, getPublishedArticles } from "@/modules/islamic-knowledge";
import {
  FULL_ARTICLE_DRAFTS,
  fullArticleIssues,
  fullArticleReviewsComplete,
  isFullArticlePublishable,
  manualChecks,
  requiredFullArticleReviews,
} from "@/modules/islamic-knowledge/full-articles";

const ids = FULL_ARTICLE_DRAFTS.map((a) => a.id);

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe("P2.5-E full article drafts: nothing can be published", () => {
  it("every draft is DRAFT, without reviews, and never publishable", () => {
    expect(FULL_ARTICLE_DRAFTS).toHaveLength(26);
    for (const a of FULL_ARTICLE_DRAFTS) {
      expect(a.status, a.id).toBe("DRAFT");
      expect(a.reviews, a.id).toEqual([]);
      expect(fullArticleReviewsComplete(a), a.id).toBe(false);
      expect(isFullArticlePublishable(a), a.id).toBe(false);
    }
  });

  it("even with complete review records the drafts stay unpublishable (no publishing path in P2.5)", () => {
    const a = { ...FULL_ARTICLE_DRAFTS[0], reviews: requiredFullArticleReviews(FULL_ARTICLE_DRAFTS[0]).map((kind) => ({ kind, reviewer: "Prüfer", reviewedAt: "2026-11-18", version: 1 })) };
    expect(fullArticleReviewsComplete(a)).toBe(true);
    expect(isFullArticlePublishable(a)).toBe(false);
  });

  it("no draft is among the published articles, in the sitemap or on a public knowledge route", () => {
    const published = getPublishedArticles().map((a) => a.id);
    for (const id of ids) expect(published).not.toContain(id);
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("full-articles");
    for (const f of files("src/app/wissen/islam")) expect(readFileSync(f, "utf8"), f).not.toContain("full-articles");
  });

  it("only the internal editorial pages and this module import the drafts; never browser code", () => {
    const importers = files("src")
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("__tests__"))
      .filter((f) => /full-articles|p25-drafts\.json/.test(readFileSync(f, "utf8")));
    expect(importers.sort()).toEqual(
      ["src/app/wissen/redaktion/artikel/[id]/page.tsx", "src/app/wissen/redaktion/artikel/page.tsx", "src/modules/islamic-knowledge/full-articles/index.ts"].sort(),
    );
    for (const f of importers) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/^["']use client["']/m);
      if (f.startsWith("src/app/")) {
        expect(src, f).toContain("if (!isInternalToolsEnabled()) notFound();");
        expect(src, f).toContain("index: false");
      }
    }
    expect(readFileSync("src/modules/islamic-knowledge/index.ts", "utf8")).not.toContain("full-articles");
  });
});

describe("P2.5-E source rules", () => {
  it("has the eight parts, only Bukhari and Muslim, labelled summaries, Bubenheim verbatim", () => {
    for (const a of FULL_ARTICLE_DRAFTS) {
      expect(fullArticleIssues(a), a.id).toEqual([]);
      for (const s of a.sunnah) expect(s.sunnahComUrl, a.id).toBe(`https://sunnah.com/${s.collection}:${s.number}`);
      for (const q of a.quran) expect(q.url, a.id).toBe(`https://quranenc.com/de/browse/german_bubenheim/${q.surah}/${q.ayah}`);
      expect(manualChecks(a).length, a.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("verses already in the verbatim store match it word for word", () => {
    const store = (verbatim as unknown as { verses: { surah: number; ayah: number; german: string }[] }).verses;
    const entries: [string, string][] = store.map((v) => [`${v.surah}:${v.ayah}`, v.german]);
    let compared = 0;
    for (const a of FULL_ARTICLE_DRAFTS)
      for (const q of a.quran) {
        const hit = entries.find(([k]) => k === `${q.surah}:${q.ayah}`);
        if (hit && hit[1]) {
          compared += 1;
          expect(q.germanVerbatim.replace(/\s+/g, " ").trim(), `${a.id} ${q.surah}:${q.ayah}`).toBe(hit[1].replace(/\s+/g, " ").trim());
        }
      }
    expect(compared).toBeGreaterThan(0);
  });

  it("every area A–F has drafts; subtopics and bundled entries exist", () => {
    for (const area of KNOWLEDGE_AREAS) {
      const list = FULL_ARTICLE_DRAFTS.filter((a) => a.area === area.id);
      expect(list.length, area.id).toBeGreaterThanOrEqual(4);
      // An article may also cover a subtopic of a neighbouring area (e.g. duʿāʾ in B and F).
      const subtopics = KNOWLEDGE_AREAS.flatMap((x) => x.subtopics.map((s) => s.id));
      for (const a of list) {
        expect(a.subtopicIds.some((s) => area.subtopics.some((x) => x.id === s)), a.id).toBe(true);
        for (const s of a.subtopicIds) expect(subtopics, `${a.id}: ${s}`).toContain(s);
      }
    }
    // Catalog ids, or the record id of the legacy text a catalog entry came from.
    const catalog = new Set(KNOWLEDGE_CATALOG.flatMap((a) => [a.id, a.legacy?.recordId].filter((x): x is string => Boolean(x))));
    for (const a of FULL_ARTICLE_DRAFTS) for (const r of a.replacesExisting) expect(catalog.has(r), `${a.id} → ${r}`).toBe(true);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
