import { readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";
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
  "src/components/wissen/wissen-hub-view.tsx",
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

describe("branding — Wasiyya (owner approval 22.11.2026)", () => {
  it("exports brand constants", () => {
    expect(BRAND.name).toBe("Wasiyya");
    expect(BRAND.descriptor).toBe("Islamische Vorsorge und Testament");
    expect(BRAND.fullName).toBe("Wasiyya – Islamische Vorsorge und Testament");
    expect(BRAND.subtitle).toBe("Islamische Vorsorge für Notfall, Janazah und Akhira");
    expect(BRAND.claim).toBe("Ich entscheide heute, was später wichtig ist.");
    expect(BRAND.heroTitle).toBe("Damit meine Familie weiß, was mir wichtig ist.");
    expect(BRAND.heroEyebrow).toBe("ISLAMISCHE VORSORGE");
    expect(BRAND.heroDescription).toContain("Halte fest, wer für dich handeln darf");
    expect(BRAND.ctaPrimary).toBe("Kostenlosen Vorsorge-Check starten");
    expect(BRAND.metadataTitle).toBe("Wasiyya – Islamische Vorsorge und Testament");
    expect(BRAND.themeColor).toBe("#1F2C4A");
  });

  it("has no legacy visible brand in key UI files", () => {
    for (const file of USER_FACING_FILES) {
      expect(hasOldBrand(read(file)), `${file} still contains legacy brand`).toBe(false);
    }
  });

  it("no visible text carries the old brand name „Amanah – Mein Wille“ (renamed to Wasiyya 22.11.2026)", () => {
    const hits = execSync("grep -rlI 'Amanah – Mein Wille' src public --include=*.ts --include=*.tsx --include=*.json || true", { encoding: "utf8" })
      .split("\n")
      .filter((f) => f && !f.includes("__tests__") && !f.endsWith("amanah-seal.tsx") && !f.endsWith("logo-candidates.tsx"));
    expect(hits).toEqual([]);
    expect(read("src/app/page.tsx")).not.toMatch(/Mein Wille/);
    expect(read("src/components/layout/wasiyya-logo.tsx")).toContain("BRAND.descriptor");
  });

  it("homepage uses hero without duplicate logo block", () => {
    const home = read("src/app/page.tsx");
    expect(home).toContain("BRAND.heroEyebrow");
    expect(home).toContain("BRAND.heroTitle");
    expect(home).toContain("BRAND.ctaPrimary");
    expect(home).not.toContain('<Logo variant="hero"');
    expect(home).toContain("AkhiraSection");
    expect(home).toContain("home-outcome-");
  });

  it("keeps the Vorsorge-Check reachable (footer, homepage) while the header shows the five main areas", () => {
    expect(read("src/lib/i18n/translations.ts")).toContain('"nav.check": "Vorsorge-Check"');
    expect(read("src/components/layout/footer.tsx")).toContain('href="/check"');
    expect(read("src/components/marketing/home-entry-points.tsx")).toContain('href: "/check"');
    for (const href of ["/wissen", "/dashboard", "/dashboard/testament", "/dashboard/janazah", "/dashboard/einstellungen"]) {
      expect(read("src/components/layout/header.tsx")).toContain(`href: "${href}"`);
    }
    expect(read("src/components/layout/header.tsx")).toContain("Registrieren");
    expect(read("src/components/layout/header.tsx")).toContain("Anmelden");
    expect(read("src/app/check/page.tsx")).toContain("CHECK_LABELS.pageTitle");
    expect(CHECK_LABELS.pageTitle).toBe("Dein islamischer Vorsorge-Check");
  });

  it("header uses the Wasiyya book-and-seal lockup (Y2, 22.11.); printed documents carry the same mark", () => {
    const logo = read("src/components/layout/logo.tsx");
    expect(logo).toContain("WasiyyaLockup");
    expect(logo).toContain("BRAND.fullName");
    expect(read("src/components/documents/document-view.tsx")).toContain("WasiyyaMark");
    expect(logo).not.toContain("MW");
    expect(logo).not.toContain("Mihrab");
  });

  it("uses the navy and gold palette without orange brand color", () => {
    const css = read("src/app/globals.css");
    expect(css).toContain("--primary: #22325A;");
    expect(css).toContain("--navy: #1A2440;");
    expect(css).toContain("--accent-light: #C9A04A;");
    expect(css).not.toMatch(/#C58A2A|#c58a2a/i);
  });

  it("homepage shows the free offer, Vorsorge Plus in preparation and what still waits for review, no purchase button", () => {
    const home = read("src/app/page.tsx");
    // Start offer (owner 23.11.2026): shared lists, Plus without price.
    expect(home).toContain("START_BASIS");
    expect(home).toContain("START_PLUS_PLANNED");
    expect(home).not.toContain("getTestPriceCents");
    expect(home).toContain("In Vorbereitung");
    expect(home).toContain("Kauf ist noch nicht möglich");
    expect(home).toContain("Wartet auf fachliche Freigabe");
    expect(home).not.toMatch(/name: "(Basic|Komplett|Familie)"/);
    expect(home).not.toContain("Details");
  });

  it("wissen hub has categories, entry topics, search and scroll sections", () => {
    expect(WISSEN_CATEGORIES).toHaveLength(4);
    expect(WISSEN_ENTRY_TOPIC_IDS).toHaveLength(3);
    const wissen = read("src/app/wissen/page.tsx") + read("src/components/wissen/wissen-hub-view.tsx");
    expect(wissen).toContain("Islamisches Wissenszentrum");
    expect(wissen).toContain("KnowledgeAreasOverview");
    expect(wissen).toContain("Worüber möchtest du mehr wissen?");
    expect(wissen).toContain("Für deinen Einstieg");
    expect(wissen).toContain("WISSEN_SECTION_ID");
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

  it("manifest uses Wasiyya and the navy theme color", () => {
    const manifest = JSON.parse(read("public/manifest.json"));
    expect(manifest.name).toBe("Wasiyya – Islamische Vorsorge und Testament");
    expect(manifest.short_name).toBe("Wasiyya");
    expect(manifest.theme_color).toBe("#1F2C4A");
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
