import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { KNOWLEDGE_AREAS } from "@/modules/islamic-knowledge/structure";
import { KNOWLEDGE_CATALOG } from "@/modules/islamic-knowledge/catalog";
import { STATUS_LABELS, isPublishable, structuralIssues, allSourceIds } from "@/modules/islamic-knowledge/workflow";
import { RESEARCH_REFERENCES } from "@/modules/islamic-knowledge/research-references";
import { islamicSources } from "@/lib/knowledge/sources";
import { QURAN_TRANSLATION_VERSION } from "@/lib/knowledge/quran-verses";

describe("P2.3 knowledge centre structure", () => {
  it("has the six requested areas A–F", () => {
    expect(KNOWLEDGE_AREAS.map((a) => `${a.letter}:${a.id}`)).toEqual(["A:faraid", "B:tod-sterben", "C:janazah", "D:vorsorge", "E:islam-und-recht", "F:akhira"]);
    expect(KNOWLEDGE_AREAS.find((a) => a.id === "akhira")!.subtopics.map((s) => s.id)).toEqual(["barzakh", "rechenschaft", "sadaqa-jariya-akhira", "nuetzliches-wissen", "bittgebete-verstorbene"]);
  });

  it("uses the requested status words", () => {
    expect(STATUS_LABELS.DRAFT).toBe("Entwurf");
    expect(STATUS_LABELS.SCHOLAR_REVIEW).toContain("Quellen geprüft");
    expect(STATUS_LABELS.APPROVED).toContain("Religiös");
    expect(STATUS_LABELS.PUBLISHED).toBe("Veröffentlicht");
  });
});

describe("P2.3 publication lock", () => {
  it("nothing is published or approved without documented reviews", () => {
    for (const article of KNOWLEDGE_CATALOG) {
      expect(["APPROVED", "PUBLISHED"].includes(article.status) && article.reviews.length === 0, article.id).toBe(false);
      expect(isPublishable(article), article.id).toBe(false);
    }
  });

  it("an article without a Qurʾān or hadith reference, or without its meaning for the folder, cannot be approved", () => {
    const base = KNOWLEDGE_CATALOG[0];
    const bare = { ...base, sourceIds: [], schoolDifferences: [], practicalNote: undefined };
    const issues = structuralIssues(bare);
    expect(issues).toContain("Kein Qurʾān- oder Hadith-Beleg.");
    expect(issues).toContain("Bedeutung für den Vorsorgeordner fehlt.");
  });

  it("every cited hadith names its collection and number and links to sunnah.com", () => {
    for (const article of KNOWLEDGE_CATALOG) {
      for (const id of allSourceIds(article)) {
        const s = islamicSources[id];
        if (s?.type !== "hadith") continue;
        expect(s.reference, id).toMatch(/(Bukhari|Muslim|Tirmidhi|Abu Dawud|Nasai|Ibn Majah).*\d/);
        expect(s.url ?? "", id).toMatch(/^https:\/\/sunnah\.com\//);
      }
    }
  });
});

describe("P2.3 research register", () => {
  it("Qurʾān only Bubenheim/Elyas on QuranEnc in the current version", () => {
    expect(QURAN_TRANSLATION_VERSION).toBe("QuranEnc german_bubenheim 1.1.5");
    for (const r of RESEARCH_REFERENCES.filter((x) => x.kind === "quran")) {
      expect(r.url, r.id).toMatch(/^https:\/\/quranenc\.com\/de\/browse\/german_bubenheim\/\d+\/\d+$/);
    }
  });

  it("hadith only from Bukhari and Muslim, with number, sunnah.com link and a manual-check note", () => {
    for (const r of RESEARCH_REFERENCES.filter((x) => x.kind === "hadith")) {
      expect(["bukhari", "muslim"], r.id).toContain(r.collection);
      expect(r.number, r.id).toMatch(/^\d+[a-z]?$/);
      expect(r.url, r.id).toBe(`https://sunnah.com/${r.collection}:${r.number}`);
      expect(r.use, r.id).toBe("reference-only");
    }
  });

  it("Ibn Kathir is referenced, never quoted", () => {
    const tafsir = RESEARCH_REFERENCES.filter((x) => x.kind === "tafsir");
    expect(tafsir.length).toBeGreaterThan(0);
    for (const t of tafsir) expect(t.use).toBe("reference-only");
    for (const a of KNOWLEDGE_CATALOG) for (const ref of a.tafsirRefs ?? []) expect(Object.keys(ref).sort()).toEqual(expect.arrayContaining(["ayah", "surah"]));
    const types = readFileSync("src/modules/islamic-knowledge/types.ts", "utf8");
    expect(types).not.toMatch(/tafsirRefs\?:[^;]*text/);
  });
});
