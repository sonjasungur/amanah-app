import { describe, it, expect } from "vitest";
import {
  islamicSources,
  getPrimarySourcesByIds,
  getSourcesByIds,
  resolveSourceId,
  LEGACY_SOURCE_ALIASES,
} from "@/lib/knowledge/sources";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { dedupePrimarySources, normalizeSourceContent } from "@/lib/knowledge/source-dedup";
import { QURAN_VERSES } from "@/lib/knowledge/quran-verses";

describe("verified source references", () => {
  it("does not contain removed bukhari 2262 or hadith-debts id", () => {
    expect(islamicSources["hadith-debts"]).toBeUndefined();
    const allRefs = Object.values(islamicSources).map((s) => s.reference).join(" ");
    expect(allRefs).not.toMatch(/\b2262\b/);
  });

  it("resolves legacy janazah ids to unified source", () => {
    expect(resolveSourceId("hadith-bukhari-janazah-1315")).toBe("hadith-janazah-hasten");
    expect(resolveSourceId("hadith-muslim-janazah-944c")).toBe("hadith-janazah-hasten");
    expect(LEGACY_SOURCE_ALIASES["hadith-bukhari-janazah-1315"]).toBe("hadith-janazah-hasten");
  });

  it("deduplicates janazah hasten hadith by sourceGroup", () => {
    const duped = dedupePrimarySources([
      islamicSources["hadith-janazah-hasten"],
      islamicSources["hadith-janazah-hasten"],
    ]);
    expect(duped).toHaveLength(1);
  });

  it("uses bukhari 2289 only for deceased-debt narration", () => {
    const src = islamicSources["hadith-debts-deceased"];
    expect(src.reference).toMatch(/2289/);
    const schulden = wissenTopics.find((t) => t.slug === "schulden-amanah");
    expect(schulden?.sourceIds).toContain("hadith-debts-deceased");
  });

  it("has quran 4:11, 4:12 and 4:176 on testament-erbe topic", () => {
    const testament = wissenTopics.find((t) => t.slug === "testament-erbe");
    expect(testament?.sourceIds).toContain("quran-nisa-4-11");
    expect(testament?.sourceIds).toContain("quran-nisa-4-12");
    expect(testament?.sourceIds).toContain("quran-nisa-4-176");
    expect(testament?.sourceIds).toContain("hadith-wasiyyah-saad");
  });

  it("janazah topic uses unified hasten source plus distinct bukhari topics", () => {
    const janazah = wissenTopics.find((t) => t.slug === "janazah-wuensche");
    expect(janazah?.sourceIds).toContain("hadith-janazah-hasten");
    expect(janazah?.sourceIds).toContain("hadith-bukhari-janazah-1254");
    expect(janazah?.sourceIds).toContain("hadith-bukhari-janazah-1273");
    const primary = getPrimarySourcesByIds(janazah!.sourceIds);
    expect(primary.some((s) => s.reference.includes("1315"))).toBe(true);
    expect(primary.some((s) => s.reference.includes("1254"))).toBe(true);
  });

  it("quran verses have quranEnc metadata and bubenheim translator", () => {
    for (const id of Object.keys(QURAN_VERSES)) {
      const src = islamicSources[id];
      expect(src.translator).toMatch(/Bubenheim/);
      expect(src.quranEncUrl).toMatch(/quranenc.com/);
      expect(src.isParaphrase).toBe(false);
    }
  });

  it("patientenverfuegung uses only german legal sources", () => {
    const pv = wissenTopics.find((t) => t.slug === "patientenverfuegung");
    expect(pv?.sourceIds).toContain("official-patientenverfuegung-bmj");
    expect(pv?.sourceIds).toContain("official-patientenverfuegung-vz");
    const primary = getPrimarySourcesByIds(pv!.sourceIds);
    expect(primary).toHaveLength(0);
  });

  it("sadaqa includes muslim 1631 and partner link", () => {
    const sadaqa = wissenTopics.find((t) => t.slug === "sadaqa-jariya");
    expect(sadaqa?.sourceIds).toContain("hadith-sadaqa-jariya");
    expect(sadaqa?.sourceIds).toContain("partner-gemeinsam1-sadaqa");
    expect(islamicSources["partner-gemeinsam1-sadaqa"].url).toMatch(/utm_source=meinwille/);
  });

  it("detects duplicate content via normalized text", () => {
    const a = normalizeSourceContent("Beschleunigt die Janazah.");
    const b = normalizeSourceContent("Beschleunigt  die Janazah!");
    expect(a).toBe(b);
  });

  it("resolves all wissen source ids without empty cards", () => {
    for (const topic of wissenTopics) {
      if (topic.sourceIds.length === 0) continue;
      const all = getSourcesByIds(topic.sourceIds);
      expect(all.length).toBe(topic.sourceIds.length);
      for (const id of topic.sourceIds) {
        expect(islamicSources[resolveSourceId(id)] ?? islamicSources[id], `missing ${id} on ${topic.slug}`).toBeDefined();
      }
      const primary = getPrimarySourcesByIds(topic.sourceIds);
      for (const s of primary) {
        expect(s.reference.length).toBeGreaterThan(0);
        expect(s.translationDe?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });
});
