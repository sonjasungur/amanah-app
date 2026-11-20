import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import verbatim from "@/lib/knowledge/data/quran-verbatim.json";
import { KNOWLEDGE_AREAS, KNOWLEDGE_CATALOG, getPublishedArticles } from "@/modules/islamic-knowledge";
import {
  FULL_ARTICLES,
  MACHINE_LEVELS,
  OPEN_EDITORIAL_TASKS,
  VERIFICATION,
  allSources,
  articleWords,
  fullArticleIssues,
  fullArticleReviewsComplete,
  isFullArticlePublishable,
  manualChecks,
  requiredFullArticleReviews,
} from "@/modules/islamic-knowledge/full-articles";

const ids = FULL_ARTICLES.map((a) => a.id);
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? files(p) : [p];
  });
}

describe("P2.6 knowledge articles: nothing can be published", () => {
  it("the 28 P2.6 drafts (two of them rewritten as version 3 in P2.7) and the P2.7 articles are DRAFT, without reviews, never publishable", () => {
    // P2.7: 26 version-2 drafts, 2 of them rewritten as version 3, plus 5 new version-3 articles.
    expect(FULL_ARTICLES).toHaveLength(33);
    for (const extra of ["p26-c-faq", "p26-e-bestattungsrecht", "p25-a-wasiyya", "p25-e-testament-form-international"]) expect(ids).toContain(extra);
    for (const a of FULL_ARTICLES) {
      expect(a.status, a.id).toBe("DRAFT");
      expect([2, 3], a.id).toContain(a.version);
      expect(a.reviews, a.id).toEqual([]);
      expect(fullArticleReviewsComplete(a), a.id).toBe(false);
      expect(isFullArticlePublishable(a), a.id).toBe(false);
    }
    const reviewed = { ...FULL_ARTICLES[0], reviews: requiredFullArticleReviews(FULL_ARTICLES[0]).map((kind) => ({ kind, reviewer: "Prüfer", reviewedAt: "2026-11-18", version: FULL_ARTICLES[0].version })) };
    expect(fullArticleReviewsComplete(reviewed)).toBe(true);
    expect(isFullArticlePublishable(reviewed)).toBe(false);
  });

  it("no draft is among the published articles, in the sitemap or on a public knowledge route", () => {
    expect(getPublishedArticles()).toEqual([]);
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("full-articles");
    for (const f of files("src/app/wissen/islam")) expect(readFileSync(f, "utf8"), f).not.toContain("full-articles");
  });

  it("only the internal review pages and this module read the drafts; never browser code", () => {
    const importers = files("src")
      .filter((f) => /\.(ts|tsx)$/.test(f) && !f.includes("__tests__"))
      .filter((f) => /full-articles|p26-articles\.json|p25-drafts/.test(readFileSync(f, "utf8")));
    expect(importers.sort()).toEqual(
      [
        "src/app/wissen/redaktion/artikel/[id]/page.tsx",
        "src/app/wissen/redaktion/artikel/page.tsx",
        "src/modules/islamic-knowledge/full-articles/index.ts",
        // P2.7: the knowledge centre preview (switch AMANAH_KNOWLEDGE_PREVIEW, off on staging and production).
        "src/app/wissen/zentrum/page.tsx",
        "src/app/wissen/zentrum/rubrik/[nr]/page.tsx",
        "src/app/wissen/zentrum/artikel/[id]/page.tsx",
        "src/components/knowledge/zentrum/article-view.tsx",
      ].sort(),
    );
    for (const f of importers) {
      const src = readFileSync(f, "utf8");
      expect(src, f).not.toMatch(/^["']use client["']/m);
      if (f.startsWith("src/app/")) {
        expect(src, f).toMatch(/if \(!(isInternalToolsEnabled|isKnowledgePreviewEnabled)\(\)\) notFound\(\);/);
        expect(src, f).toContain("index: false");
      }
    }
  });
});

describe("P2.6 source rules", () => {
  it("each article meets the structure: kinds, refs, required parts, labelled summaries, allowed collections", () => {
    for (const a of FULL_ARTICLES) expect(fullArticleIssues(a), a.id).toEqual([]);
  });

  it("no source carries a level only a person may set; Tafsir is never 'wortlaut'", () => {
    for (const a of FULL_ARTICLES)
      for (const s of allSources(a)) {
        expect(MACHINE_LEVELS, `${a.id} ${s.ref}`).toContain(s.status.level);
        if (s.type === "tafsir") expect(s.status.level).not.toBe("wortlaut_abgeglichen");
      }
  });

  it("the independent check found every Qur'an text, hadith number and Arabic excerpt", () => {
    expect(VERIFICATION).toBeDefined();
    expect(VERIFICATION!.quran.exact).toBe(VERIFICATION!.quran.total);
    expect(VERIFICATION!.hadith.numberFound).toBe(VERIFICATION!.hadith.total);
    expect(VERIFICATION!.hadith.arabicMatches).toBe(VERIFICATION!.hadith.total);
  });

  it("verses already in the verbatim store match it word for word", () => {
    const store = (verbatim as unknown as { verses: { surah: number; ayah: number; german: string }[] }).verses;
    let compared = 0;
    for (const a of FULL_ARTICLES)
      for (const q of a.sources.quran) {
        const hit = store.find((v) => v.surah === q.surah && v.ayah === q.ayah);
        if (hit) {
          compared += 1;
          expect(q.germanVerbatim.replace(/\s+/g, " ").trim(), `${a.id} ${q.ref}`).toBe(hit.german.replace(/\s+/g, " ").trim());
        }
      }
    expect(compared).toBeGreaterThan(0);
  });

  it("articles are full texts, not notes, and every one names what a person must still check", () => {
    for (const a of FULL_ARTICLES) {
      expect(articleWords(a), a.id).toBeGreaterThanOrEqual(1200);
      expect(manualChecks(a).length, a.id).toBeGreaterThanOrEqual(2);
    }
  });

  it("every area A–F has articles; subtopics and bundled entries exist; nothing is left without an article", () => {
    const subtopics = KNOWLEDGE_AREAS.flatMap((x) => x.subtopics.map((s) => s.id));
    for (const area of KNOWLEDGE_AREAS) expect(FULL_ARTICLES.filter((a) => a.area === area.id).length, area.id).toBeGreaterThanOrEqual(4);
    for (const a of FULL_ARTICLES) for (const s of a.subtopicIds) expect(subtopics, `${a.id}: ${s}`).toContain(s);
    const catalog = new Set(KNOWLEDGE_CATALOG.flatMap((a) => [a.id, a.legacy?.recordId].filter((x): x is string => Boolean(x))));
    for (const a of FULL_ARTICLES) for (const r of a.replacesExisting) expect(catalog.has(r), `${a.id} → ${r}`).toBe(true);
    const covered = new Set([...KNOWLEDGE_CATALOG.map((a) => a.subtopicId), ...FULL_ARTICLES.flatMap((a) => a.subtopicIds)]);
    expect(subtopics.filter((s) => !covered.has(s))).toEqual([]);
    expect(OPEN_EDITORIAL_TASKS).toEqual([]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
