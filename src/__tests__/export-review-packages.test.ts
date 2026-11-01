import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { getSourcesByIds } from "@/lib/knowledge/sources";
import { allSourceIds } from "@/modules/islamic-knowledge";
import { START_ARTICLE_DRAFTS } from "@/modules/islamic-knowledge/drafts/start-articles";
import { questionsByRole, requiredReviews, reviewPackageMarkdown, scholarChecklistMarkdown, sourceOverviewMarkdown } from "@/modules/islamic-knowledge";

/** `npm run export:review-packages` writes the ten packages; the normal test run only checks them. */
const exportDir = process.env.EXPORT_REVIEW_PACKAGES_DIR;

describe("review packages as Markdown", () => {
  it("contain text, sources, questions per role and empty reviewer fields", () => {
    for (const article of START_ARTICLE_DRAFTS) {
      const md = reviewPackageMarkdown(article, "2026-10-31");
      expect(md).toContain(`# Prüfpaket: ${article.title}`);
      expect(md).toContain("nicht zur Veröffentlichung");
      for (const role of requiredReviews(article)) {
        for (const q of questionsByRole(article)[role]) expect(md).toContain(q.question);
      }
      expect(md).toContain("Name und Qualifikation: ______");
      expect(md).not.toMatch(/☒|\[x\]/i);
    }
  });

  it("scholar checklist covers every article and pre-fills nothing", () => {
    const md = scholarChecklistMarkdown(START_ARTICLE_DRAFTS, "2026-11-01");
    expect(md).toContain("keine Fatwa");
    for (const article of START_ARTICLE_DRAFTS) {
      expect(md).toContain(`[Prüfpaket](${article.id}.md)`);
      for (const q of questionsByRole(article).scholar) expect(md).toContain(q.question);
    }
    expect(md).not.toMatch(/☒|\[x\]/i);
  });

  it("source overview lists every source and shows blocked ones as blocked", () => {
    const md = sourceOverviewMarkdown(START_ARTICLE_DRAFTS, "2026-11-01");
    const ids = new Set(START_ARTICLE_DRAFTS.flatMap((a) => allSourceIds(a)));
    expect(md).toContain(`Quellen gesamt: ${ids.size}`);
    for (const row of getSourcesByIds([...ids])) expect(md).toContain(row.reference);
    expect(md).toContain("blockiert");
    expect(md).toContain("ersetzt nicht die Quellenprüfung");
  });

  it.runIf(Boolean(exportDir))("exports the ten start packages", () => {
    const dir = path.resolve(process.cwd(), exportDir!);
    mkdirSync(dir, { recursive: true });
    const date = new Date().toISOString().slice(0, 10);
    const index = ["# Prüfpakete – zehn Startartikel", "", `Erzeugt ${date} mit \`npm run export:review-packages\`. Nicht zur Veröffentlichung.`, "", "| Artikel | Prüfungen | Fragen |", "|---|---|---|"];
    for (const article of START_ARTICLE_DRAFTS) {
      writeFileSync(path.join(dir, `${article.id}.md`), reviewPackageMarkdown(article, date));
      const q = questionsByRole(article);
      const roles = requiredReviews(article);
      index.push(`| [${article.title}](${article.id}.md) | ${roles.join(", ")} | ${roles.map((r) => `${r}: ${q[r].length}`).join(" · ")} |`);
    }
    index.push("", "Übergreifend: [Prüfliste für islamische Fachpersonen](PRUEFLISTE-GELEHRTE.md) · [Quellenübersicht](QUELLENUEBERSICHT.md)");
    writeFileSync(path.join(dir, "README.md"), index.join("\n") + "\n");
    writeFileSync(path.join(dir, "PRUEFLISTE-GELEHRTE.md"), scholarChecklistMarkdown(START_ARTICLE_DRAFTS, date));
    writeFileSync(path.join(dir, "QUELLENUEBERSICHT.md"), sourceOverviewMarkdown(START_ARTICLE_DRAFTS, date));
  });
});
