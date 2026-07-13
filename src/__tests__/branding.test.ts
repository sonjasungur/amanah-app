import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BRAND } from "@/lib/brand";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { WISSEN_CATEGORIES } from "@/lib/knowledge/wissen-categories";
import { WISSEN_ENTRY_TOPIC_IDS } from "@/lib/knowledge/wissen-hub";
import { PROVISIONAL_LOGO_VARIANT } from "@/components/layout/logo-candidates";

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
];

describe("branding — Mein Wille", () => {
  it("exports brand constants", () => {
    expect(BRAND.name).toBe("Mein Wille");
    expect(BRAND.subtitle).toBe("Islamische Vorsorge für Notfall, Janazah und Akhira");
    expect(BRAND.claim).toBe("Ich entscheide heute, was später wichtig ist.");
    expect(BRAND.heroTitle).toBe("Damit meine Familie weiß, was mir wichtig ist.");
    expect(BRAND.heroEyebrow).toBe("ISLAMISCHE VORSORGE");
    expect(BRAND.heroDescription).toContain("Halte fest, wer für dich handeln darf");
    expect(BRAND.ctaPrimary).toBe("Kostenlos prüfen, was noch fehlt");
    expect(BRAND.metadataTitle).toBe("Mein Wille – Islamische Vorsorge");
    expect(BRAND.themeColor).toBe("#071A16");
  });

  it("has no legacy visible brand in key UI files", () => {
    for (const file of USER_FACING_FILES) {
      expect(hasOldBrand(read(file)), `${file} still contains legacy brand`).toBe(false);
    }
  });

  it("homepage uses hero without duplicate logo block", () => {
    const home = read("src/app/page.tsx");
    expect(home).toContain("BRAND.heroEyebrow");
    expect(home).toContain("BRAND.heroTitle");
    expect(home).toContain("BRAND.ctaPrimary");
    expect(home).not.toContain('<Logo variant="hero"');
    expect(home).toContain("AkhiraSection");
    expect(home).toContain("OutcomeCard");
  });

  it("uses Vorsorge-Check label in navigation while keeping /check route", () => {
    expect(read("src/lib/i18n/translations.ts")).toContain('"nav.check": "Vorsorge-Check"');
    expect(read("src/components/layout/header.tsx")).toContain('href: "/check"');
    expect(read("src/components/layout/header.tsx")).toContain("Anmelden");
    expect(read("src/app/check/page.tsx")).toContain("CHECK_LABELS.pageTitle");
    expect(CHECK_LABELS.pageTitle).toBe("Dein islamischer Vorsorge-Check");
  });

  it("wordmark in header has no logo symbol", () => {
    const logo = read("src/components/layout/logo.tsx");
    expect(logo).not.toContain("LogoMark");
    expect(logo).toContain("Mein ");
    expect(logo).toContain("Wille");
  });

  it("uses strengthened green palette without orange brand color", () => {
    const css = read("src/app/globals.css");
    expect(css).toContain("#087A4E");
    expect(css).toContain("#10A865");
    expect(css).toContain("#071A16");
    expect(css).not.toMatch(/#C58A2A|#c58a2a/i);
  });

  it("preise page shows free check and three main packages unchanged", () => {
    const preise = read("src/app/preise/page.tsx");
    expect(preise).toContain("CHECK_LABELS.freeCard");
    expect(preise).toContain("Komplett");
    expect(preise).toContain("79 €");
    expect(preise).toContain("Noch nicht verfügbar");
  });

  it("wissen hub has categories, entry topics, search and scroll sections", () => {
    expect(WISSEN_CATEGORIES).toHaveLength(4);
    expect(WISSEN_ENTRY_TOPIC_IDS).toHaveLength(3);
    const wissen = read("src/app/wissen/page.tsx");
    expect(wissen).toContain("Wissen, das dir Entscheidungen leichter macht");
    expect(wissen).toContain("Worüber möchtest du mehr wissen?");
    expect(wissen).toContain("Für deinen Einstieg");
    expect(wissen).toContain("WISSEN_SECTION_ID.janazah");
    expect(wissen).not.toContain("Gespeicherte Themen");
  });

  it("brand review page shows three logo candidates", () => {
    const review = read("src/app/brand-review/page.tsx");
    expect(review).toContain('variant={id}');
    expect(read("src/components/layout/logo-candidates.tsx")).toContain('id: "A"');
    expect(read("src/components/layout/logo-candidates.tsx")).toContain('id: "B"');
    expect(read("src/components/layout/logo-candidates.tsx")).toContain('id: "C"');
    expect(PROVISIONAL_LOGO_VARIANT).toBe("A");
  });

  it("manifest uses Mein Wille and new theme color", () => {
    const manifest = JSON.parse(read("public/manifest.json"));
    expect(manifest.name).toBe("Mein Wille – Islamische Vorsorge");
    expect(manifest.short_name).toBe("Mein Wille");
    expect(manifest.theme_color).toBe("#071A16");
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
