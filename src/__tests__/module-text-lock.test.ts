import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { hasCompleteReview, MODULE_TEXTS, moduleText, resolveModuleText, type ModuleTextId } from "@/lib/content/module-texts";
import { buildFamilyLetterTemplate } from "@/lib/export/family-letter-template";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { translations } from "@/lib/i18n/translations";
import { DOCUMENT_CHECKLIST } from "@/lib/vorsorge/documents";

const ARCHIVE = readFileSync("docs/release/gesperrte-modultexte.md", "utf8");
const originals = [...ARCHIVE.matchAll(/^- \*\*Original:\*\* (.+)$/gm)].map((m) => m[1].trim());

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return name === "__tests__" || name === "generated" ? [] : walk(path);
    return /\.(tsx?|json)$/.test(name) ? [path] : [];
  });
const squash = (text: string) => text.replace(/\s+/g, " ");

describe("locked module texts", () => {
  it("keeps every original for the review", () => {
    expect(originals.length).toBeGreaterThanOrEqual(18);
  });

  it("no original appears anywhere in the source, so no page, API or bundle can deliver it", () => {
    // Server-only drafts are covered by knowledge-client-bundle.test.ts and public-knowledge-access.test.ts.
    const source = walk("src")
      .filter((file) => !/src\/(lib\/knowledge|modules\/islamic-knowledge)\//.test(file))
      .map((file) => [file, squash(readFileSync(file, "utf8"))] as const);
    const found = originals.flatMap((original) =>
      source.filter(([, code]) => code.includes(original)).map(([file]) => `${file}: ${original}`),
    );
    expect(found).toEqual([]);
  });

  it("nothing is released, and every text is usable", () => {
    for (const [id, entry] of Object.entries(MODULE_TEXTS)) {
      expect("released" in entry, id).toBe(false);
      expect(moduleText(id as ModuleTextId).trim().length, id).toBeGreaterThan(5);
    }
  });

  it("a release counts only with a complete review", () => {
    const entry = { de: "neutral", released: { de: "geprüft", review: { reviewer: "", reviewedAt: "2026-01-01", document: "x" } } };
    expect(resolveModuleText(entry)).toBe("neutral");
    expect(hasCompleteReview(entry.released.review)).toBe(false);
    entry.released.review.reviewer = "Prüfer";
    expect(resolveModuleText(entry)).toBe("geprüft");
  });

  it("the family letter stays complete, without leaving a gap", () => {
    const data = {
      ...defaultAmanahData,
      powerOfAttorney: { ...defaultAmanahData.powerOfAttorney, authorizedPerson: "Vertrauensperson" },
      debtsAmanah: [{ id: "d1", type: "debt_owed", description: "Test" }],
    } as unknown as typeof defaultAmanahData;
    const letter = buildFamilyLetterTemplate(data);
    expect(letter).toContain("Vertrauensperson benannte Person");
    expect(letter).toContain("Mir ist wichtig: [bitte in eigenen Worten ergänzen]");
    expect(letter).toContain("Einzelheiten stehen im Ordner.");
    expect(letter).not.toMatch(/undefined|— \.|\n- \n/);
  });

  it("the document list keeps a working hint where one was locked", () => {
    for (const type of ["vorsorgevollmacht", "testament", "ausweis"]) {
      expect(DOCUMENT_CHECKLIST.find((d) => d.type === type)?.hint.length, type).toBeGreaterThan(5);
    }
  });
});

describe("languages", () => {
  const unreviewed = ["tr", "ar", "bs", "sq"] as const;

  it("languages without review carry no marketing claims and no review badge", () => {
    for (const locale of unreviewed) {
      for (const key of ["hero.title", "hero.subtitle", "hero.claim", "review.badge"]) {
        expect(translations[locale][key], `${locale} ${key}`).toBeUndefined();
      }
    }
  });

  it("no language claims a running or finished review, or a permitted scope", () => {
    const all = JSON.stringify(translations);
    expect(all).not.toMatch(/zulässigen Rahmen|permissible scope|scholarly review|Geprüfte Wissensbasis|المراجعة الشرعية|İlmî inceleme/);
    for (const key of Object.keys(translations.tr)) expect(translations.de[key], key).toBeDefined();
  });
});
