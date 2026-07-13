import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import { WISSEN_CATEGORIES } from "@/lib/knowledge/wissen-categories";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function hasOldBrand(text: string): boolean {
  return (
    /\bAmanahOrdner\b/.test(text) ||
    /\bAmanah Ordner\b/i.test(text) ||
    /\bAmanah Vorsorge\b/.test(text)
  );
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
  "public/icon.svg",
];

describe("branding — Mein Wille", () => {
  it("exports brand constants", () => {
    expect(BRAND.name).toBe("Mein Wille");
    expect(BRAND.subtitle).toBe("Islamische Vorsorge für Notfall, Janazah und Akhira");
    expect(BRAND.claim).toBe("Ich entscheide heute, was später wichtig ist.");
    expect(BRAND.heroTitle).toBe("Damit meine Familie weiß, was mir wichtig ist.");
    expect(BRAND.ctaPrimary).toBe("Kostenlos prüfen, was noch fehlt");
    expect(BRAND.metadataTitle).toBe("Mein Wille – Islamische Vorsorge");
  });

  it("has no legacy visible brand in key UI files", () => {
    for (const file of USER_FACING_FILES) {
      expect(hasOldBrand(read(file)), `${file} still contains legacy brand`).toBe(false);
    }
  });

  it("homepage uses final hero and CTA", () => {
    const home = read("src/app/page.tsx");
    expect(home).toContain("BRAND.heroTitle");
    expect(home).toContain("BRAND.ctaPrimary");
    expect(home).toContain("BRAND.description");
    expect(home).toContain("AkhiraSection");
    expect(home).not.toContain("Was möchtest du vorbereiten");
  });

  it("uses green palette without orange brand color", () => {
    const css = read("src/app/globals.css");
    expect(css).toContain("#166534");
    expect(css).not.toMatch(/#C58A2A|#c58a2a/i);
  });

  it("preise page shows free check and three main packages", () => {
    const preise = read("src/app/preise/page.tsx");
    expect(preise).toContain("Amanah-Check — 0 €");
    expect(preise).toContain("Komplett");
    expect(preise).toContain("Noch nicht verfügbar");
  });

  it("wissen page has four categories", () => {
    expect(WISSEN_CATEGORIES).toHaveLength(4);
    expect(read("src/app/wissen/page.tsx")).toContain("Wissen, das dir Entscheidungen leichter macht");
  });

  it("manifest uses Mein Wille", () => {
    const manifest = JSON.parse(read("public/manifest.json"));
    expect(manifest.name).toBe("Mein Wille – Islamische Vorsorge");
    expect(manifest.short_name).toBe("Mein Wille");
    expect(manifest.theme_color).toBe("#0B1511");
    expect(manifest.icons.some((i: { src: string }) => i.src === "/icon-192.png")).toBe(true);
    expect(manifest.icons.some((i: { src: string }) => i.src === "/icon-512.png")).toBe(true);
  });

  it("icon assets exist and are non-empty", () => {
    for (const file of [
      "public/icon.svg",
      "public/icon-192.png",
      "public/icon-512.png",
      "public/apple-touch-icon.png",
      "src/app/favicon.ico",
    ]) {
      const stat = readFileSync(join(ROOT, file));
      expect(stat.length, `${file} is empty`).toBeGreaterThan(100);
    }
  });
});
