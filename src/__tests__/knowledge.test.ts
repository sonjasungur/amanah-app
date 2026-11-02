import { describe, it, expect, beforeEach } from "vitest";
import {
  getAllEntries,
  getProductionEntries,
  getReviewedEntries,
  getEntriesNeedingReview,
  getEntryById,
  keywordSearch,
  retrieveKnowledgeSync,
  buildGroundedKnowledgeAnswer,
  isProductionSafe,
  classifyKnowledgeSensitivity,
} from "@/lib/knowledge";
import { answerKnowledgeQuestion } from "@/lib/ai/knowledge-answer";
import { GET as searchGET } from "@/app/api/knowledge/search/route";
import { GET as entriesGET } from "@/app/api/knowledge/entries/route";
import { GET as entryGET } from "@/app/api/knowledge/entries/[id]/route";
import { POST as knowledgePOST } from "@/app/api/ai/knowledge/route";
import { resetAmanahAIProvider } from "@/lib/ai/ai-provider";

describe("Knowledge entry schema", () => {
  it("has required fields on all entries", () => {
    for (const e of getAllEntries()) {
      expect(e.id).toBeTruthy();
      expect(e.title).toBeTruthy();
      expect(e.summary).toBeTruthy();
      expect(e.content).toBeTruthy();
      expect(e.sourceLabel).toBeTruthy();
      expect(e.tags.length).toBeGreaterThan(0);
      expect(["draft", "reviewed", "needs_review", "orientation"]).toContain(e.reviewedStatus);
      expect(["low", "medium", "sensitive"]).toContain(e.riskLevel);
    }
  });

  it("filters production-safe entries", () => {
    const prod = getProductionEntries();
    expect(prod.every(isProductionSafe)).toBe(true);
    expect(prod.some((e) => e.id === "kb-janazah-deutschland")).toBe(false);
  });

  it("lists reviewed and needs-review entries", () => {
    expect(getReviewedEntries()).toEqual([]);
    expect(getEntriesNeedingReview().length).toBeGreaterThan(0);
  });
});

describe("Keyword search", () => {
  it("ranks Notfallmappe query", () => {
    const results = keywordSearch("Notfallmappe", getProductionEntries(), { topK: 3 });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.id).toContain("notfallmappe");
  });

  it("finds Vorsorgevollmacht", () => {
    const results = retrieveKnowledgeSync("Was ist eine Vorsorgevollmacht?", { productionOnly: false });
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].entry.category).toBe("vorsorgevollmacht");
    expect(retrieveKnowledgeSync("Was ist eine Vorsorgevollmacht?").some((r) => r.entry.category === "vorsorgevollmacht")).toBe(false);
  });

  it("returns empty for nonsense query with high min score", () => {
    const results = keywordSearch("xyzabc123", getProductionEntries(), { minScore: 50 });
    expect(results.length).toBe(0);
  });
});

describe("Grounded knowledge answer", () => {
  it("answers with citations for allowed question", () => {
    const r = buildGroundedKnowledgeAnswer("Was gehört in eine Notfallmappe?");
    expect(r.blocked).toBe(false);
    expect(r.citations.length).toBeGreaterThan(0);
    expect(r.usedEntryIds.length).toBeGreaterThan(0);
    expect(r.answer).toContain("Notfallmappe");
  });

  it("returns no-source fallback", () => {
    const r = buildGroundedKnowledgeAnswer("xkqwmz pqrstv wxyabc");
    expect(r.noSource).toBe(true);
    expect(r.citations.length).toBe(0);
  });

  it("blocks legal individual questions", () => {
    const r = buildGroundedKnowledgeAnswer("Ist mein Testament gültig?");
    expect(r.blocked).toBe(true);
    expect(r.safetyLevel).toBe("legal_sensitive");
  });

  it("blocks medical individual questions", () => {
    expect(classifyKnowledgeSensitivity("Welche medizinische Behandlung soll ich ablehnen?")).toBe("medical_sensitive");
    const r = buildGroundedKnowledgeAnswer("Welche medizinische Behandlung soll ich ablehnen?");
    expect(r.blocked).toBe(true);
  });

  it("blocks fatwa questions", () => {
    const r = buildGroundedKnowledgeAnswer("Gib mir eine Fatwa zu meiner Erbverteilung.");
    expect(r.blocked).toBe(true);
    expect(r.safetyLevel).toBe("religious_sensitive");
  });
});

describe("Knowledge API routes", () => {
  it("GET /api/knowledge/search", async () => {
    const res = await searchGET(new Request("http://localhost/api/knowledge/search?q=Notfallmappe"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBeGreaterThan(0);
    expect(body.results[0].title).toBeTruthy();
  });

  it("GET /api/knowledge/entries", async () => {
    const res = await entriesGET(new Request("http://localhost/api/knowledge/entries"));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.count).toBe(5);
  });

  it("GET /api/knowledge/entries/[id]", async () => {
    const res = await entryGET(new Request("http://localhost/api/knowledge/entries/kb-app-grenzen"), {
      params: Promise.resolve({ id: "kb-app-grenzen" }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.entry.id).toBe("kb-app-grenzen");
  });

  it("returns 404 for unknown entry", async () => {
    const res = await entryGET(new Request("http://localhost/api/knowledge/entries/missing"), {
      params: Promise.resolve({ id: "missing" }),
    });
    expect(res.status).toBe(404);
  });
});

describe("Knowledge AI integration", () => {
  beforeEach(() => {
    resetAmanahAIProvider();
    process.env.AMANAH_AI_ENABLED = "true";
    process.env.AMANAH_AI_PROVIDER = "rules";
    delete process.env.OPENAI_API_KEY;
  });

  it("POST /api/ai/knowledge returns citations", async () => {
    const res = await knowledgePOST(
      new Request("http://localhost/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Was gehört in eine Notfallmappe?" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.citations?.length).toBeGreaterThan(0);
    expect(body.usedEntryIds?.length).toBeGreaterThan(0);
  });

  it("OpenAI path does not crash without key", async () => {
    const r = await answerKnowledgeQuestion("Was ist Sadaqa Jariya?", { useOpenAI: true });
    expect(r.blocked).toBe(false);
    expect(r.answer).toContain("fachlich freigegebenen");
  });
});

describe("Entry lookup", () => {
  it("finds entry by id", () => {
    expect(getEntryById("kb-app-grenzen")?.category).toBe("app-grenzen");
  });
});
