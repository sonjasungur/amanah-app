import { describe, expect, it } from "vitest";
import { KNOWLEDGE_CATALOG, questionsByRole, requiredReviews, reviewQuestions } from "@/modules/islamic-knowledge";
import { START_ARTICLE_DRAFTS } from "@/modules/islamic-knowledge/drafts/start-articles";

describe("review questions per role", () => {
  it("every start article gets questions for each required role", () => {
    for (const article of START_ARTICLE_DRAFTS) {
      const grouped = questionsByRole(article);
      for (const role of requiredReviews(article)) expect(grouped[role].length, `${article.id} ${role}`).toBeGreaterThan(0);
    }
  });

  it("asks about every source, every open marker and every open school question", () => {
    for (const article of START_ARTICLE_DRAFTS) {
      const questions = reviewQuestions(article);
      const refs = new Set(questions.map((q) => q.ref));
      for (const id of article.sourceIds) expect(refs.has(id), `${article.id} source ${id}`).toBe(true);
      const markers = [...article.body.matchAll(/\[(Redaktion|Juristische Prüfung):/g)].length;
      expect(questions.filter((q) => q.question.startsWith("Offener Punkt:")).length, article.id).toBeGreaterThanOrEqual(markers);
      for (const d of article.schoolDifferences ?? []) {
        if (d.positions.length === 0) expect(refs.has(d.question), `${article.id} ${d.question}`).toBe(true);
      }
    }
  });

  it("articles with legal markers require a legal review", () => {
    for (const article of KNOWLEDGE_CATALOG) {
      if (reviewQuestions(article).some((q) => q.role === "legal" && q.question.startsWith("Offener Punkt:"))) {
        expect(article.requiresLegalReview, article.id).toBe(true);
      }
    }
  });

  it("hadith with gradings ask for printed evidence; no question repeats within a package", () => {
    const graded = { ...START_ARTICLE_DRAFTS[0], sourceIds: ["hadith-graves-visit"], schoolDifferences: [] };
    expect(reviewQuestions(graded).some((q) => q.ref === "hadith-graves-visit" && q.question.includes("Einstufungen (at-Tirmidhī"))).toBe(true);
    for (const article of KNOWLEDGE_CATALOG) {
      const texts = reviewQuestions(article).map((q) => `${q.role}:${q.question}`);
      expect(new Set(texts).size, article.id).toBe(texts.length);
    }
  });
});
