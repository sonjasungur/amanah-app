import { describe, expect, it } from "vitest";
import { GET as linksGET } from "@/app/api/knowledge/published-links/route";
import { GET as entryGET } from "@/app/api/knowledge/entries/[id]/route";
import { GET as entriesGET } from "@/app/api/knowledge/entries/route";
import { GET as searchGET } from "@/app/api/knowledge/search/route";
import sitemap from "@/app/sitemap";
import { answerKnowledgeQuestion } from "@/lib/ai/knowledge-answer";
import {
  barzakhArticles,
  getAllEntries,
  ghuslKafanArticles,
  hasReviewEvidence,
  isProductionSafe,
  janazahArticles,
  patientenverfuegungArticles,
  sadaqaJariyaArticles,
  testamentArticles,
  wissenTopics,
} from "@/lib/knowledge";
import type { KnowledgeEntry } from "@/lib/knowledge";
import { getPublicWissenTopics } from "@/lib/knowledge/wissen-topics";
import { getPublishedArticles, KNOWLEDGE_CATALOG } from "@/modules/islamic-knowledge";

/** Everything without a documented review. Holds for as long as no review exists; then adjust deliberately. */
const RELIGIOUS_OR_LEGAL = [
  "kb-vorsorgevollmacht-allgemein",
  "kb-patientenverfuegung-allgemein",
  "kb-bestattungswuensche-allgemein",
  "kb-janazah-begriffe",
  "kb-ghusl-kafan",
  "kb-sadaqa-jariya",
  "kb-digitaler-nachlass",
  "kb-janazah-deutschland",
];
const SENSITIVE_QUESTIONS = ["Was ist Ghusl?", "Was ist Kafan?", "Was bedeutet Janazah?", "Was ist Sadaqa Jariya?", "Was ist eine Patientenverfügung?", "Was ist eine Vorsorgevollmacht?", "Was ist Barzakh?"];
const SENSITIVE_SEARCH = ["ghusl", "kafan", "janazah", "sadaqa", "patientenverfügung", "vorsorgevollmacht", "testament erbe", "barzakh"];
const get = (path: string) => new Request(`http://localhost${path}`);

describe("reviewed only with a documented review", () => {
  it("no legacy article or entry claims a review without evidence", () => {
    const articles = [...janazahArticles, ...barzakhArticles, ...testamentArticles, ...patientenverfuegungArticles, ...sadaqaJariyaArticles, ...ghuslKafanArticles, ...wissenTopics];
    expect(articles.filter((a) => a.reviewStatus === "reviewed").map((a) => a.id)).toEqual([]);
    expect(getAllEntries().filter((e) => e.reviewedStatus === "reviewed" && !hasReviewEvidence(e)).map((e) => e.id)).toEqual([]);
    expect(getAllEntries().filter((e) => e.lastReviewedAt && !hasReviewEvidence(e)).map((e) => e.id)).toEqual([]);
  });

  it("the status alone opens nothing, a complete review does", () => {
    const entry = getAllEntries().find((e) => e.id === "kb-ghusl-kafan") as KnowledgeEntry;
    expect(isProductionSafe(entry)).toBe(false);
    expect(isProductionSafe({ ...entry, reviewedStatus: "reviewed" })).toBe(false);
    expect(isProductionSafe({ ...entry, reviewedStatus: "reviewed", reviewEvidence: { reviewer: "", reviewedAt: "2026-01-01", document: "x" } })).toBe(false);
    expect(isProductionSafe({ ...entry, reviewedStatus: "reviewed", reviewEvidence: { reviewer: "Prüfer", reviewedAt: "2026-01-01", document: "Protokoll" } })).toBe(true);
  });

  it("nothing public yet: no article, topic or link", async () => {
    expect(getPublishedArticles()).toEqual([]);
    expect(getPublicWissenTopics()).toEqual([]);
    expect((await linksGET().json()).articles).toEqual([]);
    const urls = sitemap().map((s) => s.url);
    for (const article of KNOWLEDGE_CATALOG) expect(urls.some((u) => u.endsWith(`/wissen/islam/${article.slug}`))).toBe(false);
    for (const topic of wissenTopics) expect(urls.some((u) => u.endsWith(`/wissen/${topic.slug}`))).toBe(false);
  });
});

describe("knowledge APIs without an account", () => {
  it("the list holds only organisational help and does not call it reviewed", async () => {
    const body = await (await entriesGET(get("/api/knowledge/entries"))).json();
    expect(body.entries.map((e: { id: string }) => e.id).sort()).toEqual(["kb-app-grenzen", "kb-dokumentenuebersicht", "kb-familiennachricht", "kb-notfallkontakte", "kb-notfallmappe-allgemein"]);
    expect(JSON.stringify(body)).not.toMatch(/Geprüfte|lastReviewedAt/);
    for (const e of body.entries) {
      expect(e.reviewedStatus).toBe("orientation");
      expect(e.reviewBadge).toBe("Organisationsinformation, nicht fachlich geprüft");
      expect(e.sourceLabel).toBe("Mein Wille — Organisationsinformation");
    }
    expect(body.disclaimer).toContain("nicht fachlich geprüft");
  });

  it("a direct request for a religious or legal entry finds nothing", async () => {
    for (const id of [...RELIGIOUS_OR_LEGAL, "kb-notfallmappe-checkliste"]) {
      const res = await entryGET(get(`/api/knowledge/entries/${id}`), { params: Promise.resolve({ id }) });
      expect(res.status, id).toBe(404);
    }
  });

  it("search finds no religious or legal entry", async () => {
    for (const q of SENSITIVE_SEARCH) {
      const body = await (await searchGET(get(`/api/knowledge/search?q=${encodeURIComponent(q)}`))).json();
      const ids = body.results.map((r: { id: string }) => r.id);
      expect(ids.filter((id: string) => RELIGIOUS_OR_LEGAL.includes(id)), q).toEqual([]);
    }
  });

  it("the AI knowledge access answers such questions without unreviewed statements", async () => {
    for (const question of SENSITIVE_QUESTIONS) {
      const result = await answerKnowledgeQuestion(question);
      expect((result.usedEntryIds ?? []).filter((id) => RELIGIOUS_OR_LEGAL.includes(id)), question).toEqual([]);
      expect(result.answer, question).not.toMatch(/rituelle Reinigung|weißen Tücher|beständige Wohltätigkeit|in deinem Namen handeln/);
    }
  });
});
