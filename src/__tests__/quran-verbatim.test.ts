import { readFileSync, readdirSync, statSync } from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import verbatim from "@/lib/knowledge/data/quran-verbatim.json";
import { QURAN_ATTRIBUTION, QURAN_VERSES } from "@/lib/knowledge/quran-verses";
import { islamicSources } from "@/lib/knowledge/sources";

describe("Qur'an texts are verbatim", () => {
  it("every verse text equals the stored QuranEnc/Tanzil text, unshortened", () => {
    for (const v of Object.values(QURAN_VERSES)) {
      const end = v.verseEnd ?? v.verseStart;
      const ayat = verbatim.verses.filter((a) => a.surah === v.surah && a.ayah >= v.verseStart && a.ayah <= end);
      expect(ayat).toHaveLength(end - v.verseStart + 1);
      expect(v.translationDe).toBe(ayat.map((a) => a.german).join(" "));
      expect(v.arabicText).toBe(ayat.map((a) => a.arabic).join(" "));
    }
  });

  it("Qur'an 4:11 states the share of a male as that of two females", () => {
    expect(QURAN_VERSES["quran-nisa-4-11"].translationDe).toContain(
      "Einem männlichen Geschlechts kommt ebensoviel zu wie der Anteil von zwei weiblichen Geschlechts"
    );
  });

  it("names translators, source, version and the Tanzil licence", () => {
    expect(QURAN_ATTRIBUTION).toContain("QuranEnc.com");
    expect(QURAN_ATTRIBUTION).toContain(`Version ${verbatim.germanTranslation.version}`);
    expect(QURAN_ATTRIBUTION).toContain("Tanzil");
    expect(verbatim.arabicText.copyrightBlock.join("\n")).toContain("CHANGING IT IS NOT ALLOWED");
    expect(islamicSources["quran-nisa-4-11"].isParaphrase).toBe(false);
    expect(islamicSources["quran-nisa-4-11"].arabicText).toBeTruthy();
  });

  it("the archive of the previous texts is never imported by the app", () => {
    const files: string[] = [];
    const walk = (dir: string) => {
      for (const name of readdirSync(dir)) {
        const p = path.join(dir, name);
        if (statSync(p).isDirectory()) walk(p);
        else if (/\.(ts|tsx)$/.test(p) && !p.includes(`${path.sep}archive${path.sep}`) && !p.includes("__tests__")) files.push(p);
      }
    };
    walk(path.join(process.cwd(), "src"));
    const importing = files.filter((f) => /from\s+["'][^"']*islamic-knowledge\/archive/.test(readFileSync(f, "utf8")));
    expect(importing).toEqual([]);
  });
});
