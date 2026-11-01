import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { articleJsonLd, getPublishedArticles, isPublishable, KNOWLEDGE_CATALOG, serializeJsonLd, type KnowledgeArticleRecord } from "@/modules/islamic-knowledge";
import { START_ARTICLE_DRAFTS } from "@/modules/islamic-knowledge/drafts/start-articles";

const review = (kind: "source" | "scholar" | "legal") => ({ kind, reviewer: "Dr. Beispiel (Testfixture)", reviewedAt: "2026-10-30", version: 1 });

const published: KnowledgeArticleRecord = {
  id: "t-1",
  slug: "testartikel",
  area: "vorsorge",
  subtopicId: "sadaqa-jariya",
  title: "Titel </script><script>alert(1)</script>",
  summary: "Zusammenfassung",
  body: "Fortlaufende Wohltätigkeit.",
  sourceIds: ["hadith-sadaqa-jariya"],
  requiresLegalReview: false,
  status: "PUBLISHED",
  version: 1,
  reviews: [review("source"), review("scholar")],
  relatedSlugs: [],
};

function filesUnder(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? filesUnder(full) : [full];
  });
}

describe("structured data", () => {
  it("describes a published article as free", () => {
    expect(isPublishable(published)).toBe(true);
    expect(articleJsonLd(published, "https://example.test")).toMatchObject({
      "@type": "Article",
      url: "https://example.test/wissen/islam/testartikel",
      isAccessibleForFree: true,
      dateModified: "2026-10-30",
    });
  });

  it("gives nothing for a draft or any catalog entry that is not published", () => {
    expect(articleJsonLd({ ...published, status: "DRAFT" }, "https://example.test")).toBeNull();
    expect(articleJsonLd({ ...published, reviews: [] }, "https://example.test")).toBeNull();
    for (const article of [...START_ARTICLE_DRAFTS, ...KNOWLEDGE_CATALOG]) {
      expect(articleJsonLd(article, "https://example.test")).toBeNull();
    }
  });

  it("cannot break out of the script tag", () => {
    expect(serializeJsonLd(articleJsonLd(published, "https://example.test")!)).not.toContain("<");
  });
});

describe("owner rule: knowledge stays free and nothing unreviewed is public", () => {
  const knowledgeFiles = [
    ...filesUnder(path.join(process.cwd(), "src/app/wissen")),
    ...filesUnder(path.join(process.cwd(), "src/components/islamic-knowledge")),
    ...filesUnder(path.join(process.cwd(), "src/components/wissen")),
    ...filesUnder(path.join(process.cwd(), "src/modules/islamic-knowledge")),
  ];

  it("no knowledge code touches billing, plans or the login", () => {
    expect(knowledgeFiles.length).toBeGreaterThan(10);
    for (const file of knowledgeFiles) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toMatch(/PlusGate|plus-gate|@\/(components|lib)\/billing|useEntitlement|requireAuth|getServerSession/);
    }
  });

  it("the catalog publishes nothing today", () => {
    expect(getPublishedArticles()).toEqual([]);
  });
});
