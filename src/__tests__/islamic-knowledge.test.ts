import { readFileSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { islamicSources } from "@/lib/knowledge/sources";
import {
  KNOWLEDGE_AREAS,
  KNOWLEDGE_CATALOG,
  blockingSources,
  canTransition,
  getAreaCoverage,
  getPublishedArticles,
  getRelatedPublished,
  isPublishable,
  missingReviews,
  searchPublished,
  structuralIssues,
  type KnowledgeArticleRecord,
} from "@/modules/islamic-knowledge";

const reviewed = (kind: "source" | "scholar" | "legal", version = 1) => ({
  kind,
  reviewer: "Dr. Beispiel (Testfixture)",
  reviewedAt: "2026-10-30",
  version,
});

const published: KnowledgeArticleRecord = {
  id: "t-1",
  slug: "testartikel",
  area: "vorsorge",
  subtopicId: "sadaqa-jariya",
  title: "Sadaqa Jariya Testartikel",
  summary: "Zusammenfassung",
  body: "Fortlaufende Wohltätigkeit.",
  sourceIds: ["hadith-sadaqa-jariya"],
  requiresLegalReview: false,
  status: "PUBLISHED",
  version: 1,
  reviews: [reviewed("source"), reviewed("scholar")],
  relatedSlugs: ["entwurf"],
};

const draft: KnowledgeArticleRecord = { ...published, id: "t-2", slug: "entwurf", status: "DRAFT", reviews: [] };

function read(file: string): string {
  return readFileSync(path.join(process.cwd(), file), "utf8");
}

describe("knowledge catalog (migrated legacy content)", () => {
  it("has unique ids and slugs and valid placements", () => {
    expect(new Set(KNOWLEDGE_CATALOG.map((a) => a.id)).size).toBe(KNOWLEDGE_CATALOG.length);
    expect(new Set(KNOWLEDGE_CATALOG.map((a) => a.slug)).size).toBe(KNOWLEDGE_CATALOG.length);
    for (const a of KNOWLEDGE_CATALOG) {
      const area = KNOWLEDGE_AREAS.find((x) => x.id === a.area);
      expect(area?.subtopics.some((s) => s.id === a.subtopicId), a.id).toBe(true);
    }
  });

  it("only cites source ids that exist", () => {
    const unknown = KNOWLEDGE_CATALOG.flatMap((a) => a.sourceIds).filter((id) => !islamicSources[id]);
    expect(unknown).toEqual([]);
  });

  it("publishes nothing yet, and no legacy record claims a review any more", () => {
    expect(KNOWLEDGE_CATALOG.some((a) => a.status === "PUBLISHED" || a.status === "APPROVED")).toBe(false);
    expect(KNOWLEDGE_CATALOG.some((a) => a.legacy?.claimedStatus === "reviewed")).toBe(false);
    expect(getPublishedArticles()).toEqual([]);
    expect(getAreaCoverage().every((c) => c.published === 0)).toBe(true);
  });

  it("keeps the original text and sources of corrected legacy records", () => {
    const barzakh = KNOWLEDGE_CATALOG.find((a) => a.id === "ik-barzakh-what")!;
    expect(barzakh.body).toContain("برزخ");
    expect(barzakh.body).not.toContain("بارزخ");
    expect(barzakh.legacy?.originalBody).toContain("بارزخ");
    expect(barzakh.version).toBe(2);
    expect(barzakh.sourceIds).toContain("hadith-sadaqa-jariya");

    const kultur = KNOWLEDGE_CATALOG.find((a) => a.id === "ik-kultur-traueressen")!;
    expect(kultur.sourceIds).toEqual([]);
    expect(kultur.status).toBe("DRAFT");
    expect(kultur.legacy?.originalSourceIds).toEqual(["hadith-sadaqa-jariya"]);
  });

  it("contains the ten starter drafts — reviewable, never publishable as they are", async () => {
    const { START_ARTICLE_DRAFTS } = await import("@/modules/islamic-knowledge/drafts/start-articles");
    expect(START_ARTICLE_DRAFTS).toHaveLength(10);
    for (const draft of START_ARTICLE_DRAFTS) {
      expect(KNOWLEDGE_CATALOG.some((a) => a.id === draft.id)).toBe(true);
      expect(draft.status).toBe("DRAFT");
      expect(draft.reviews).toEqual([]);
      expect(draft.sourceIds.length).toBeGreaterThan(0);
      expect(draft.sourceIds.every((id) => islamicSources[id])).toBe(true);
      // Even with complete (fictitious) reviews, open markers keep a draft unpublished.
      const forced = { ...draft, status: "PUBLISHED" as const, reviews: [reviewed("source"), reviewed("scholar"), reviewed("legal")] };
      expect(isPublishable(forced), draft.id).toBe(false);
      if (draft.requiresLegalReview) expect(draft.germanLawNote).toBeTruthy();
    }
  });

  it("puts areas touching German law under legal review", () => {
    for (const a of KNOWLEDGE_CATALOG.filter((x) => x.area === "islam-und-recht")) {
      expect(a.requiresLegalReview).toBe(true);
    }
  });
});

describe("publication gate", () => {
  it("publishes a fully reviewed article with checked sources", () => {
    expect(isPublishable(published)).toBe(true);
  });

  it("blocks missing, outdated or anonymous reviews", () => {
    expect(isPublishable({ ...published, reviews: [reviewed("source")] })).toBe(false);
    expect(isPublishable({ ...published, version: 2 })).toBe(false);
    expect(isPublishable({ ...published, reviews: [reviewed("source"), { ...reviewed("scholar"), reviewer: " " }] })).toBe(false);
  });

  it("requires a legal review where German law is involved", () => {
    const legal = { ...published, requiresLegalReview: true };
    expect(missingReviews(legal)).toEqual(["legal"]);
    expect(isPublishable({ ...legal, reviews: [...legal.reviews, reviewed("legal")] })).toBe(true);
  });

  it("blocks sources with an open finding or no check at all", () => {
    expect(blockingSources(["fiqh-ghusl-kafan"])).toEqual(["fiqh-ghusl-kafan"]);
    expect(isPublishable({ ...published, sourceIds: ["fiqh-ghusl-kafan"] })).toBe(false);
    expect(isPublishable({ ...published, sourceIds: ["unbekannte-quelle"] })).toBe(false);
    expect(isPublishable({ ...published, sourceIds: [] })).toBe(false);
  });

  it("only accepts 'agreement' when all four schools are documented, each position with a source", () => {
    const threeSchools = {
      ...published,
      schoolDifferences: [
        { question: "Frage", kind: "agreement" as const, positions: [{ schools: ["hanafi", "maliki", "shafii"] as const, position: "x", sourceIds: ["hadith-sadaqa-jariya"] }].map((p) => ({ ...p, schools: [...p.schools] })) },
      ],
    };
    expect(structuralIssues(threeSchools)).toHaveLength(1);
    expect(isPublishable(threeSchools)).toBe(false);

    const unsourced = {
      ...published,
      schoolDifferences: [{ question: "Frage", kind: "difference" as const, positions: [{ schools: ["hanafi" as const], position: "x", sourceIds: [] }] }],
    };
    expect(isPublishable(unsourced)).toBe(false);
  });

  it("checks sources cited inside school positions", () => {
    const nested = {
      ...published,
      schoolDifferences: [{ question: "Frage", kind: "difference" as const, positions: [{ schools: ["shafii" as const], position: "x", sourceIds: ["fiqh-ghusl-kafan"] }] }],
    };
    expect(isPublishable(nested)).toBe(false);
  });

  it("moves forward one reviewed step at a time", () => {
    const sourceReview = { ...draft, status: "SOURCE_REVIEW" as const };
    expect(canTransition(draft, "PUBLISHED").allowed).toBe(false);
    expect(canTransition(sourceReview, "SCHOLAR_REVIEW").allowed).toBe(false);
    expect(canTransition({ ...sourceReview, reviews: [reviewed("source")] }, "SCHOLAR_REVIEW").allowed).toBe(true);
    expect(canTransition({ ...published, status: "SCHOLAR_REVIEW", sourceIds: ["fiqh-ghusl-kafan"] }, "APPROVED").allowed).toBe(false);
    expect(canTransition(published, "DRAFT").allowed).toBe(true);
  });

  it("search and related links only ever return published articles", () => {
    const catalog = [published, { ...draft, body: "Fortlaufende Wohltätigkeit." }];
    expect(searchPublished("wohltatigkeit", catalog).map((a) => a.id)).toEqual(["t-1"]);
    expect(getRelatedPublished(published, catalog)).toEqual([]);
  });
});

describe("former topic pages go through the gate", () => {
  it.each(["janazah-kompass", "barzakh", "testament-erbe", "islam-oder-kultur", "sadaqa-jariya"])("%s", (route) => {
    const source = read(`src/app/${route}/page.tsx`);
    expect(source).toContain("GatedAreaPage");
    expect(source).not.toMatch(/@\/lib\/knowledge\/|SourcesSection|sadaqaProjects/);
  });

  it("internal editorial preview is never public", () => {
    expect(read("src/app/wissen/redaktion/page.tsx")).toContain("if (!isInternalToolsEnabled()) notFound();");
  });
});
