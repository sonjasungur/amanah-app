import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { CHECK_LABELS } from "@/lib/design-tokens";
import { WISSEN_SECTION_ID, WISSEN_SIDEBAR_ITEMS } from "@/lib/knowledge/wissen-hub";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { islamicSources } from "@/lib/knowledge/sources";

const ROOT = join(process.cwd());

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

describe("UX corrections — wordmark, buttons, wissen", () => {
  it("header and footer use wordmark only without LogoMark", () => {
    const logo = read("src/components/layout/logo.tsx");
    const header = read("src/components/layout/header.tsx");
    const footer = read("src/components/layout/footer.tsx");
    expect(logo).not.toContain("LogoMark");
    expect(logo).toContain("Mein ");
    expect(logo).toContain("Wille");
    expect(header).not.toContain("LogoMark");
    expect(footer).not.toContain("LogoMark");
    expect(footer).toContain("Mein ");
    expect(footer).toContain("Wille");
  });

  it("header shows Anmelden and Mein Konto labels", () => {
    const header = read("src/components/layout/header.tsx");
    expect(header).toContain("Anmelden");
    expect(header).toContain("Mein Konto");
    expect(header).toContain('href="/login"');
    expect(header).toContain('href="/dashboard"');
  });

  it("check start button uses Vorsorge-Check starten", () => {
    expect(CHECK_LABELS.startButton).toBe("Vorsorge-Check starten");
    expect(read("src/components/check/amanah-check.tsx")).toContain("CHECK_LABELS.startButton");
    expect(read("src/components/check/amanah-check.tsx")).not.toContain("Amanah-Check");
  });

  it("homepage replaces fake progress hero card with check outcome info", () => {
    const home = read("src/app/page.tsx");
    expect(home).toContain("Nach dem kostenlosen Check weißt du:");
    expect(home).toContain("Dein Ergebnis basiert auf deinen Antworten");
    expect(home).not.toContain("Dein nächster Schritt");
    expect(home).not.toMatch(/pct|Fortschritt.*%/);
  });

  it("wissen page has scroll-spy section ids and no saved topics", () => {
    const wissen = read("src/app/wissen/page.tsx");
    expect(wissen).toContain("useWissenScrollSpy");
    expect(wissen).toContain("WISSEN_SECTION_ID.janazah");
    expect(wissen).toContain("WISSEN_SECTION_ID.notfall");
    expect(WISSEN_SIDEBAR_ITEMS.some((i) => i.label.includes("Gespeicherte"))).toBe(false);
    expect(wissen).not.toContain("Gespeicherte Themen");
  });

  it("wissen topic rows link to detail slugs as clickable cards", () => {
    const row = read("src/components/wissen/wissen-topic-row.tsx");
    expect(row).toContain("/wissen/${article.slug}");
    expect(row).not.toContain("Übernehmen");
    expect(row).not.toContain("FolderInput");
    for (const topic of wissenTopics) {
      expect(topic.slug.length).toBeGreaterThan(0);
    }
  });

  it("wissen detail puts knowledge before form CTA", () => {
    const detail = read("src/app/wissen/[slug]/page.tsx");
    const card = read("src/components/knowledge/rich-article-card.tsx");
    expect(card).toContain("Kurz erklärt");
    expect(card).toContain("Qur'an und authentische Sunnah");
    expect(card).toContain("Was sollte ich mit meiner Familie klären?");
    expect(card).toContain("Mein nächster Schritt");
    expect(detail.indexOf("RichArticleCard")).toBeLessThan(detail.indexOf("WissenFormCta"));
    expect(detail).not.toContain("Amanah-Check");
  });

  it("janazah reference page includes bukhari 1315 and muslim 944c before form CTA", () => {
    const janazah = wissenTopics.find((t) => t.slug === "janazah-wuensche");
    expect(janazah?.sourceIds).toContain("hadith-bukhari-janazah-1315");
    expect(janazah?.sourceIds).toContain("hadith-muslim-janazah-944c");
    expect(islamicSources["hadith-bukhari-janazah-1315"].reference).toMatch(/1315/);
    expect(islamicSources["hadith-muslim-janazah-944c"].reference).toMatch(/944c/);
    const detail = read("src/app/wissen/[slug]/page.tsx");
    expect(detail).toContain("Janazah-Wünsche jetzt festhalten");
  });

  it("linkButtonClassName helper avoids empty nested button links", () => {
    const button = read("src/components/ui/button.tsx");
    expect(button).toContain("linkButtonClassName");
    expect(read("src/components/layout/header.tsx")).toContain("linkButtonClassName");
  });

  it("storage keys unchanged in check state machine", () => {
    expect(read("src/lib/check/state-machine.ts")).toContain("amanah-check-progress-v3");
  });
});
