import { describe, it, expect } from "vitest";
import { getSourcesByIds, islamicSources } from "@/lib/knowledge/sources";
import { searchKnowledge, getAllPublishedArticles } from "@/lib/knowledge";
import { searchFuneralPartners, funeralPartners } from "@/lib/mock/funeral-partners";
import { checkInheritance, calculateProgress, getCriticalMissing } from "@/lib/utils/progress";
import { defaultAmanahData } from "@/lib/storage/amanah-store";
import { cultureFilterCards } from "@/lib/knowledge/kulturfilter";

describe("Islamic Sources", () => {
  it("has required source entries", () => {
    expect(islamicSources["quran-nisa-4-11"]).toBeDefined();
    expect(islamicSources["hadith-sadaqa-jariya"]).toBeDefined();
    expect(islamicSources["hadith-janazah-hasten"]).toBeDefined();
    expect(islamicSources["quran-barzakh"]).toBeDefined();
  });

  it("retrieves sources by ids", () => {
    const sources = getSourcesByIds(["quran-nisa-4-11", "hadith-wasiyyah-third"]);
    expect(sources).toHaveLength(2);
    expect(sources[0].type).toBe("quran");
  });
});

describe("Knowledge Base", () => {
  it("returns only non-draft articles", () => {
    const articles = getAllPublishedArticles();
    expect(articles.length).toBeGreaterThan(10);
    expect(articles.every((a) => a.reviewStatus !== "draft")).toBe(true);
  });

  it("searches knowledge by query", () => {
    const results = searchKnowledge("janazah");
    expect(results.length).toBeGreaterThan(0);
  });

  it("all culture filter cards have sources", () => {
    for (const card of cultureFilterCards) {
      expect(card.sourceIds.length).toBeGreaterThan(0);
      expect(card.reviewStatus).not.toBe("draft");
    }
  });
});

describe("Funeral Partners", () => {
  it("has at least 6 partners", () => {
    expect(funeralPartners.length).toBeGreaterThanOrEqual(6);
  });

  it("searches by city", () => {
    const results = searchFuneralPartners("Berlin");
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].city).toBe("Berlin");
  });
});

describe("Inheritance Check", () => {
  it("returns red for excluding daughters", () => {
    const result = checkInheritance({
      ...defaultAmanahData.inheritanceProfile,
      desiredWasiyyah: "Tochter ausschließen und alles an Sohn",
    });
    expect(result.status).toBe("red");
    expect(result.warnings.length).toBeGreaterThan(0);
  });

  it("returns green for basic profile", () => {
    const result = checkInheritance({
      ...defaultAmanahData.inheritanceProfile,
      sons: 2,
      daughters: 1,
      married: true,
    });
    expect(result.status).toBe("green");
  });
});

describe("Progress", () => {
  it("calculates low progress for empty data", () => {
    const progress = calculateProgress(defaultAmanahData);
    expect(progress).toBeLessThan(20);
  });

  it("identifies critical missing fields", () => {
    const missing = getCriticalMissing(defaultAmanahData);
    expect(missing).toContain("Notfallkontakt");
  });
});
