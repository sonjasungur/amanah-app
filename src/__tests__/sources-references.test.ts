import { describe, it, expect } from "vitest";
import { islamicSources, getPrimarySourcesByIds, getSourcesByIds } from "@/lib/knowledge/sources";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";

describe("verified source references", () => {
  it("does not contain removed bukhari 2262 or hadith-debts id", () => {
    expect(islamicSources["hadith-debts"]).toBeUndefined();
    const allRefs = Object.values(islamicSources).map((s) => s.reference).join(" ");
    expect(allRefs).not.toMatch(/\b2262\b/);
  });

  it("uses bukhari 2289 only for deceased-debt narration", () => {
    const src = islamicSources["hadith-debts-deceased"];
    expect(src).toBeDefined();
    expect(src.reference).toMatch(/2289/);
    expect(src.note).toMatch(/ersetzt keine individuelle/i);

    const testament = wissenTopics.find((t) => t.slug === "testament-erbe");
    expect(testament?.sourceIds).not.toContain("hadith-debts-deceased");

    const schulden = wissenTopics.find((t) => t.slug === "schulden-amanah");
    expect(schulden?.sourceIds).toContain("hadith-debts-deceased");
    expect(schulden?.sourceIds).toContain("quran-nisa-4-11");
    expect(schulden?.sourceIds).toContain("quran-nisa-4-12");
  });

  it("has quran 4:11 and 4:12 on testament-erbe topic", () => {
    const testament = wissenTopics.find((t) => t.slug === "testament-erbe");
    expect(testament?.sourceIds).toContain("quran-nisa-4-11");
    expect(testament?.sourceIds).toContain("quran-nisa-4-12");
    expect(testament?.sourceIds).not.toContain("hadith-debts");
  });

  it("displays muslim 944c and bukhari 1315 on janazah topic", () => {
    const janazah = wissenTopics.find((t) => t.slug === "janazah-wuensche");
    expect(janazah?.sourceIds).toContain("hadith-bukhari-janazah-1315");
    expect(janazah?.sourceIds).toContain("hadith-muslim-janazah-944c");
    expect(islamicSources["hadith-bukhari-janazah-1315"].reference).toMatch(/1315/);
    expect(islamicSources["hadith-muslim-janazah-944c"].reference).toMatch(/944c/);
  });

  it("displays muslim 944c for janazah hasten combined source", () => {
    const src = islamicSources["hadith-janazah-hasten"];
    expect(src.reference).toMatch(/944c/);
    expect(src.reference).toMatch(/1315/);
  });

  it("displays muslim 1628a for wasiyyah third", () => {
    const src = islamicSources["hadith-wasiyyah-third"];
    expect(src.reference).toMatch(/1628a/);
    expect(src.reference).toMatch(/2742/);
  });

  it("keeps muslim 1631 for sadaqa jariya", () => {
    const src = islamicSources["hadith-sadaqa-jariya"];
    expect(src.reference).toMatch(/1631/);
  });

  it("resolves all wissen primary source ids without empty cards", () => {
    for (const topic of wissenTopics) {
      const primary = getPrimarySourcesByIds(topic.sourceIds);
      const all = getSourcesByIds(topic.sourceIds);
      expect(all.length).toBe(topic.sourceIds.length);
      for (const id of topic.sourceIds) {
        expect(islamicSources[id], `missing source ${id} on ${topic.slug}`).toBeDefined();
      }
      for (const s of primary) {
        expect(s.reference.length).toBeGreaterThan(0);
        expect(s.translationDe?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});
