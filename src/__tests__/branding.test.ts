import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import { WISSEN_CATEGORIES, WISSEN_CATEGORY_CONFIG } from "@/lib/knowledge/wissen-categories";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

/** Matches standalone old brand, not the type name AmanahOrdnerData */
function hasOldBrand(text: string): boolean {
  return /\bAmanahOrdner\b/.test(text) || /\bAmanah Ordner\b/i.test(text);
}

const USER_FACING_FILES = [
  "src/app/page.tsx",
  "src/app/preise/page.tsx",
  "src/app/wissen/page.tsx",
  "src/app/layout.tsx",
  "src/components/layout/footer.tsx",
  "src/components/layout/logo.tsx",
  "public/manifest.json",
  "src/lib/i18n/translations.ts",
  "src/lib/export/family-letter-template.ts",
  "src/lib/knowledge/entries.ts",
  "src/lib/ai/prompts.ts",
  "src/components/print/print-views.tsx",
];

describe("branding — Amanah Vorsorge", () => {
  it("exports brand constants", () => {
    expect(BRAND.name).toBe("Amanah Vorsorge");
    expect(BRAND.tagline).toBe("Dein Notfall- und Vorsorgeplan");
    expect(BRAND.emotional).toBe("Für Notfall. Für Familie. Für Akhira.");
  });

  it("has no visible AmanahOrdner in key UI files", () => {
    for (const file of USER_FACING_FILES) {
      expect(hasOldBrand(read(file)), `${file} still contains AmanahOrdner`).toBe(false);
    }
  });

  it("homepage structure matches rebrand spec", () => {
    const home = read("src/app/page.tsx");
    expect(home).toContain("Damit deine Familie nicht raten muss.");
    expect(home).toContain("Kostenlosen 3-Minuten-Check starten");
    expect(home).toContain("Für wen ist Amanah Vorsorge?");
    expect(home).toContain("AkhiraSection");
    expect(home).not.toContain("Was möchtest du vorbereiten");
    expect(home).not.toContain("PathSelector");
  });

  it("preise page shows free check and three main packages", () => {
    const preise = read("src/app/preise/page.tsx");
    expect(preise).toContain("Amanah-Check — 0 €");
    expect(preise).toContain("Basic");
    expect(preise).toContain("Komplett");
    expect(preise).toContain("Familie");
    expect(preise).toContain("29 €");
    expect(preise).toContain("79 €");
    expect(preise).toContain("99 €");
    expect(preise).toContain("Noch nicht verfügbar");
    expect(preise).toContain("Weitere Einzelpakete");
  });

  it("wissen page has four categories", () => {
    const wissen = read("src/app/wissen/page.tsx");
    expect(wissen).toContain("Wissen, das dir Entscheidungen leichter macht");
    expect(wissen).toContain("WISSEN_CATEGORIES");
    expect(WISSEN_CATEGORIES).toHaveLength(4);
    expect(Object.keys(WISSEN_CATEGORY_CONFIG)).toHaveLength(4);
  });

  it("manifest uses new app name", () => {
    const manifest = JSON.parse(read("public/manifest.json"));
    expect(manifest.name).toBe("Amanah Vorsorge");
    expect(manifest.short_name).toBe("Amanah Vorsorge");
  });
});
