/**
 * Owner acceptance 27.11.2026: the German laws under an article need a "what is it about" line, without the
 * duplicated heading, and the source list must not overwhelm (grouped and folded).
 */
import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { explainLaw, shortLawTitle } from "@/lib/knowledge/law-explanations";
import { SourceList } from "@/components/knowledge/zentrum/article-view";
import { ENTRY_ARTICLE, FULL_ARTICLES } from "@/modules/islamic-knowledge/full-articles";

const getAllFullArticles = () => [...FULL_ARTICLES, ...(ENTRY_ARTICLE ? [ENTRY_ARTICLE] : [])];

describe("law sources in the knowledge centre", () => {
  it("explains every cited law", () => {
    const missing = new Set<string>();
    for (const a of getAllFullArticles()) for (const l of a.sources.law) if (!explainLaw(l.title)) missing.add(l.title);
    expect([...missing]).toEqual([]);
  });

  it("knows the core norms correctly", () => {
    expect(explainLaw("§ 2247 BGB – Eigenhändiges Testament")).toMatch(/von Hand geschrieben und unterschrieben/);
    expect(explainLaw("§ 1939 BGB – Vermächtnis")).toMatch(/ohne ihn zum Erben zu machen/);
    expect(explainLaw("Verordnung (EU) Nr. 650/2012 (EU-Erbrechtsverordnung), Art. 21 (Allgemeine Kollisionsnorm) und Art. 22 (Rechtswahl)")).toMatch(/gewöhnlich gelebt.*Staatsangehörigkeit/);
    expect(shortLawTitle("Bestattungsgesetz (BestG) vom 22. September 2025, GVBl. 2025, 554")).toBe("Bestattungsgesetz (BestG)");
  });

  it("groups and folds the sources and shows each law once with its explanation", () => {
    const article = getAllFullArticles().find((a) => a.sources.law.length > 3)!;
    const html = renderToStaticMarkup(<SourceList article={article} />);
    expect(html).toContain('data-testid="source-group-law"');
    expect(html).toMatch(/<details[^>]*source-group-law/);
    expect(html).not.toMatch(/<details[^>]* open/);
    const rows = html.match(/data-testid="law-row"/g) ?? [];
    expect(rows.length).toBe(new Set(article.sources.law.map((l) => l.ref)).size);
    const first = shortLawTitle(article.sources.law[0].title);
    expect(html.split(first).length - 1).toBe(1);
    expect(html).toContain("Gesetzestext");
  });
});
