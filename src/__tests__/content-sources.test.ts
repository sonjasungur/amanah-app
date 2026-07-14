import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

const HOME_AREAS = [
  { slug: "notfallkarte", href: "/wissen/notfallkarte" },
  { slug: "vorsorgevollmacht", href: "/wissen/vorsorgevollmacht" },
  { slug: "janazah-wuensche", href: "/wissen/janazah-wuensche" },
  { slug: "testament-erbe", href: "/wissen/testament-erbe" },
  { slug: "digitaler-nachlass", href: "/wissen/digitaler-nachlass" },
  { slug: "sadaqa-jariya", href: "/wissen/sadaqa-jariya" },
];

describe("content sources, tiles, and article structure", () => {
  it("homepage area tiles link to wissen routes", () => {
    const home = read("src/app/page.tsx");
    for (const { slug, href } of HOME_AREAS) {
      expect(home).toContain(`href: "${href}"`);
      expect(home).toContain('data-testid={`home-area-${href.split("/").pop()}`}');
      expect(wissenTopics.some((t) => t.slug === slug)).toBe(true);
    }
    expect(home).toContain("Thema öffnen");
  });

  it("article card uses unified sections A–H", () => {
    const card = read("src/components/knowledge/rich-article-card.tsx");
    expect(card).toContain("In 30 Sekunden");
    expect(card).toContain("Was bedeutet das praktisch?");
    expect(card).toContain("Was du heute erledigen kannst");
    expect(card).toContain("Was du mit deiner Familie klären solltest");
    expect(card).toContain("Deutschland: Dokumente und rechtliche Hinweise");
    expect(card).toContain("Was passiert, wenn es ungeklärt bleibt?");
    expect(card).toContain("Jetzt in Mein Wille festhalten");
    expect(card).not.toContain("Mein nächster Schritt");
  });

  it("check uses direct import without dynamic loading fallback", () => {
    const checkPage = read("src/app/check/page.tsx");
    expect(checkPage).not.toContain("dynamic(");
    expect(checkPage).toContain('from "@/components/check/amanah-check"');
  });

  it("check state machine has hydrate timeout", () => {
    const sm = read("src/lib/check/state-machine.ts");
    expect(sm).toContain("CHECK_HYDRATE_TIMEOUT_MS");
    expect(sm).toContain("HYDRATE_TIMEOUT");
    expect(sm).toContain("createInitialCheckState");
  });

  it("primary source cards use aria-expanded disclosure", () => {
    const psc = read("src/components/ui/primary-source-card.tsx");
    expect(psc).toContain("aria-expanded");
    expect(read("src/lib/knowledge/quran-verses.ts")).toContain("Bubenheim");
  });

  it("akhira section tiles and source disclosure are functional", () => {
    const akhira = read("src/components/marketing/akhira-section.tsx");
    expect(akhira).toContain("aria-expanded");
    expect(akhira).toContain("/wissen/sadaqa-jariya");
  });

  it("audit document exists", () => {
    const audit = read("docs/content-source-audit.md");
    expect(audit).toContain("QURAN_PRIMARY");
    expect(audit).toContain("janazah-hasten");
  });

  it("barzakh and akhira articles exist with slugs", () => {
    expect(wissenTopics.some((t) => t.slug === "barzakh")).toBe(true);
    expect(wissenTopics.some((t) => t.slug === "akhira-vorsorge")).toBe(true);
  });
});
