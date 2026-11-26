import { existsSync, readFileSync, readdirSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { TOPIC_IMAGES } from "@/lib/content/topic-images";

const read = (p: string) => readFileSync(p, "utf8");

describe("design Royal Imperial (owner acceptance 25.11.2026)", () => {
  it("uses only own, self-hosted images that exist", () => {
    for (const img of Object.values(TOPIC_IMAGES)) {
      expect(img.src).toMatch(/^\/images\/wasiyya\/[a-z-]+\.jpg$/);
      expect(existsSync(`public${img.src}`)).toBe(true);
      expect(img.alt.length).toBeGreaterThan(10);
    }
    expect(read("src/app/impressum/page.tsx")).toContain("IMAGE_CREDIT");
  });

  it("links every topic page to matching functions of the planning folder", () => {
    for (const page of ["janazah-kompass", "patientenverfuegung", "testament-erbe", "sadaqa-jariya", "barzakh", "islam-oder-kultur", "akuter-todesfall", "bestatter", "konvertierte"]) {
      const src = read(`src/app/${page}/page.tsx`);
      expect(src, page).toMatch(/href: "\/dashboard\/[a-z-]+"/);
      for (const m of src.matchAll(/href: "\/dashboard\/([a-z-]+)"/g)) {
        expect(readdirSync("src/app/dashboard"), `${page} → ${m[1]}`).toContain(m[1]);
      }
    }
  });

  it("keeps the Vorsorge-Check card in place while an answer is saved", () => {
    const check = read("src/components/check/amanah-check.tsx");
    expect(check).not.toContain("animate-spin text-accent\" size={28}");
    expect(check).not.toMatch(/active:scale|ring-offset/);
    expect(check).toContain('data-testid="check-saving"');
  });

  it("names the managing director only where the law requires it (imprint), not in the privacy policy", () => {
    expect(read("src/app/datenschutz/page.tsx")).not.toContain("representedBy");
    expect(read("src/app/impressum/page.tsx")).toContain("representedBy");
  });

  it("pricing has no subscription, no price and no purchase", () => {
    const preise = read("src/app/preise/page.tsx");
    expect(preise).toContain("Kein Abo");
    expect(preise).not.toMatch(/\d+\s?€|checkout|kaufen/i);
  });
});

describe("knowledge review on staging (owner order 26.11.2026)", () => {
  it("opens the editorial pages only with the preview or internal switch, and production refuses the preview", async () => {
    const { isEditorialPreviewEnabled } = await import("@/lib/flags/knowledge-preview");
    const { validateProductionEnv } = await import("@/lib/server/production-config");
    const old = { ...process.env };
    try {
      delete process.env.AMANAH_KNOWLEDGE_PREVIEW;
      delete process.env.AMANAH_INTERNAL_TOOLS;
      expect(isEditorialPreviewEnabled()).toBe(false);
      process.env.AMANAH_KNOWLEDGE_PREVIEW = "true";
      expect(isEditorialPreviewEnabled()).toBe(true);
    } finally {
      process.env = old;
    }
    expect(validateProductionEnv({ AMANAH_KNOWLEDGE_PREVIEW: "true" } as unknown as NodeJS.ProcessEnv).errors.join(" ")).toContain("AMANAH_KNOWLEDGE_PREVIEW");
  });
});
