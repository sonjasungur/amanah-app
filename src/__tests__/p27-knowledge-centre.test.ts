/**
 * P2.7 knowledge centre: entry page and six rubrics as a preview of unpublished drafts. Reachable without
 * signing in only where the preview switch is on; staging and production answer 404. Source rules of the
 * owner's approved source line.
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { isKnowledgePreviewEnabled } from "@/lib/flags/knowledge-preview";
import { ENTRY_ARTICLE, FULL_ARTICLES, fullArticleIssues, isFullArticlePublishable } from "@/modules/islamic-knowledge/full-articles";
import { RUBRICS, articlesInRubric, getCentreArticle } from "@/modules/islamic-knowledge/full-articles/rubrics";

const files = (dir: string): string[] => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? files(join(dir, f)) : [join(dir, f)]));

afterEach(() => vi.unstubAllEnvs());

describe("P2.7 knowledge centre: preview only, nothing published", () => {
  it("the preview switch is off unless development or AMANAH_KNOWLEDGE_PREVIEW=true", () => {
    vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "");
    vi.stubEnv("NODE_ENV", "production");
    expect(isKnowledgePreviewEnabled()).toBe(false);
    vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "true");
    expect(isKnowledgePreviewEnabled()).toBe(true);
    vi.stubEnv("AMANAH_KNOWLEDGE_PREVIEW", "1");
    expect(isKnowledgePreviewEnabled()).toBe(false);
  });

  it("staging and production configuration never switch the preview on", () => {
    for (const f of [".env.staging.example", ".env.production.example", "docker-compose.staging.yml", "docker-compose.prod.yml", "Dockerfile"]) {
      let text = "";
      try {
        text = readFileSync(f, "utf8");
      } catch {
        continue;
      }
      expect(text, f).not.toMatch(/AMANAH_KNOWLEDGE_PREVIEW\s*[:=]\s*["']?true/);
    }
  });

  it("every centre page checks the switch first, is dynamic and never indexed", () => {
    const pages = files("src/app/wissen/zentrum").filter((f) => f.endsWith("page.tsx"));
    expect(pages.length).toBe(4);
    for (const f of pages) {
      const src = readFileSync(f, "utf8");
      expect(src, f).toContain("if (!isKnowledgePreviewEnabled()) notFound();");
      expect(src, f).toContain('export const dynamic = "force-dynamic"');
      expect(src, f).toContain("index: false");
      expect(src, f).not.toMatch(/^["']use client["']/m);
    }
    expect(readFileSync("src/app/sitemap.ts", "utf8")).not.toContain("zentrum");
  });

  it("drafts stay drafts: never publishable, no reviews", () => {
    for (const a of [...FULL_ARTICLES, ...(ENTRY_ARTICLE ? [ENTRY_ARTICLE] : [])]) {
      expect(a.status, a.id).toBe("DRAFT");
      expect(a.reviews, a.id).toEqual([]);
      expect(isFullArticlePublishable(a), a.id).toBe(false);
    }
  });
});

describe("P2.7 structure: entry page, six rubrics, reader questions", () => {
  it("six rubrics, each with articles; every article has a rubric, a reader question and a next step", () => {
    expect(RUBRICS.map((r) => r.nr)).toEqual([1, 2, 3, 4, 5, 6]);
    for (const r of RUBRICS) expect(articlesInRubric(r.nr).length, r.title).toBeGreaterThan(0);
    for (const a of FULL_ARTICLES) {
      expect(a.rubric, a.id).toBeGreaterThanOrEqual(1);
      expect(a.rubric, a.id).toBeLessThanOrEqual(6);
      expect(a.readerQuestion?.trim(), a.id).toBeTruthy();
      expect(a.nextStep?.trim(), a.id).toBeTruthy();
      expect(fullArticleIssues(a), a.id).toEqual([]);
    }
  });

  it("the entry page answers its question with topics, next steps and links that resolve", () => {
    expect(ENTRY_ARTICLE?.readerQuestion).toBe("Was passiert, wenn ich in Deutschland nichts geregelt habe?");
    expect(fullArticleIssues(ENTRY_ARTICLE!)).toEqual([]);
    expect(ENTRY_ARTICLE!.topics!.length).toBeGreaterThanOrEqual(6);
    for (const t of ENTRY_ARTICLE!.topics!) {
      expect(t.nextStep.trim(), t.title).toBeTruthy();
      expect(t.rubric, t.title).toBeGreaterThanOrEqual(1);
      for (const id of t.articleIds) expect(getCentreArticle(id), `${t.title} → ${id}`).toBeDefined();
    }
  });

  it("FAQ entries point to sources of their own article and to existing articles", () => {
    for (const a of FULL_ARTICLES.filter((x) => x.faq?.length)) {
      const refs = new Set([...a.sources.quran, ...a.sources.hadith, ...a.sources.tafsir, ...a.sources.law, ...(a.sources.fatwa ?? [])].map((s) => s.ref));
      for (const f of a.faq!) {
        for (const r of f.refs) expect(refs.has(r), `${a.id}: ${f.question} → ${r}`).toBe(true);
        for (const id of f.relatedArticleIds) expect(getCentreArticle(id), `${f.question} → ${id}`).toBeDefined();
      }
    }
  });
});

describe("P2.7 source line", () => {
  const all = [...FULL_ARTICLES, ...(ENTRY_ARTICLE ? [ENTRY_ARTICLE] : [])];
  it("Qur'an: Arabic text and the Bubenheim/Elyas translation for every verse", () => {
    for (const a of all) for (const q of a.sources.quran) {
      expect(q.arabic?.trim(), `${a.id} ${q.ref}`).toBeTruthy();
      expect(q.url, `${a.id} ${q.ref}`).toContain("german_bubenheim");
    }
  });

  it("German Ibn Kaṯīr pages only for 3:185 (Band 2, S. 358–361)", () => {
    for (const a of all) for (const t of a.sources.tafsir) {
      if (!t.germanEdition) continue;
      expect([t.surah, t.ayah], `${a.id} ${t.ref}`).toEqual([3, 185]);
      expect(t.germanEdition).toMatchObject({ volume: 2, pages: "358–361" });
    }
  });

  it("hadith outside Bukhari and Muslim carry a named grading of exactly that number", () => {
    for (const a of all) for (const h of a.sources.hadith) {
      if (h.collection === "bukhari" || h.collection === "muslim") continue;
      expect((h.grading ?? []).length, `${a.id} ${h.ref}`).toBeGreaterThan(0);
    }
    // Abū Dāwūd 3565 (al-Albānī: ṣaḥīḥ) and 2870 (al-Albānī: ḥasan ṣaḥīḥ) are never mixed up.
    for (const a of all) for (const h of a.sources.hadith.filter((x) => x.collection === "abudawud")) {
      const albani = (h.grading ?? []).find((g) => /alb[aā]n/i.test(g.by))?.grade.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
      if (h.number === "3565" && albani) expect(albani).toBe("sahih");
      if (h.number === "2870" && albani) expect(albani).toBe("hasan sahih");
    }
  });

  it("fatwas name author, work, place, the original question and a link", () => {
    for (const a of all) for (const f of a.sources.fatwa ?? []) {
      for (const k of ["author", "work", "locator", "url", "question"] as const) expect(f[k]?.trim(), `${a.id} ${f.ref} ${k}`).toBeTruthy();
    }
  });
});
