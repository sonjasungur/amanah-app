import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { START_ARTICLE_DRAFTS } from "@/modules/islamic-knowledge/drafts/start-articles";
import { questionsByRole, requiredReviews, reviewPackageMarkdown } from "@/modules/islamic-knowledge";

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
    writeFileSync(path.join(dir, "README.md"), index.join("\n") + "\n");
  });
});
