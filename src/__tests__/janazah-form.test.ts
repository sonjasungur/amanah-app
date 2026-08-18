import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { janazahFields, janazahSections } from "@/lib/modules/janazah-sections";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { moduleConfigs } from "@/lib/modules/config";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("product tiles and navigation", () => {
  it("homepage does not jump anonymously into dashboard modules", () => {
    const home = read("src/app/page.tsx");
    expect(home).not.toContain("home-area-");
    expect(home).not.toContain("Modul öffnen");
    expect(home).toContain("BRAND.ctaPrimary");
  });

  it("dashboard module tiles reference valid routes under Alle Vorsorgebereiche", () => {
    const tiles = read("src/components/dashboard/module-tiles.tsx");
    expect(tiles).toContain("moduleConfigs");
    expect(tiles).toContain("Alle Vorsorgebereiche");
    expect(tiles).toContain("dashboard-tile-${mod.id}");
    const paths = moduleConfigs.map((m) => m.path);
    for (const route of ["/dashboard/notfallkarte", "/dashboard/janazah", "/dashboard/vollmacht", "/dashboard/testament", "/dashboard/digitaler-nachlass", "/dashboard/familie"]) {
      expect(paths).toContain(route);
    }
  });
});

describe("Janazah wishes form", () => {
  it("defines structured sections covering required areas", () => {
    const sectionIds = janazahSections.map((s) => s.id);
    expect(sectionIds).toEqual(["grunddaten", "benachrichtigung", "ghusl-janazah", "beisetzung", "persoenlich"]);
    expect(janazahFields.length).toBeGreaterThanOrEqual(20);
  });

  it("includes legal notice and persistence UI in form component", () => {
    const form = read("src/components/modules/janazah-wishes-form.tsx");
    expect(form).toContain("JanazahLegalNotice");
    expect(form).toContain('data-testid="janazah-form"');
    expect(form).toContain('data-testid="janazah-save-success"');
    expect(form).toContain("janazahWishes");
    expect(form).toContain("SaveStatusIndicator");
  });

  it("shows legal and religious notice", () => {
    const notice = read("src/components/modules/janazah-legal-notice.tsx");
    expect(notice).toContain("kein notarielles Testament");
    expect(notice).toContain("Rechtsschule");
    expect(notice).toContain('data-testid="janazah-legal-notice"');
  });

  it("defaults include all Janazah fields for migration merge", () => {
    const keys = Object.keys(defaultAmanahData.janazahWishes);
    expect(keys).toContain("fullName");
    expect(keys).toContain("peopleToNotify");
    expect(keys).toContain("donationWishes");
    expect(keys).toContain("additionalWishes");
  });

  it("birth date field is conditional on profile", () => {
    const birthField = janazahFields.find((f) => f.key === "birthDate");
    expect(birthField?.showWhenProfileBirthDateEmpty).toBe(true);
  });

  it("optional fields have no required constraint in field config", () => {
    for (const field of janazahFields) {
      expect(field.label.length).toBeGreaterThan(0);
      expect(["text", "textarea", "select", "boolean", "number"]).toContain(field.type);
    }
  });
});
