import { describe, it, expect, beforeEach } from "vitest";
import { classifyUserIntent, enforceAiSafety, safeResponseTemplate } from "@/lib/ai/safety";
import { ruleBasedAIProvider } from "@/lib/ai/rule-based-ai-provider";
import { mockAIProvider } from "@/lib/ai/mock-ai-provider";
import {
  buildExtractContext,
  buildFamilyMessageContext,
  buildKnowledgeContext,
  buildNextQuestionContext,
  sanitizeForAi,
} from "@/lib/ai/context";
import {
  isCompletionReviewResult,
  isExtractResult,
  isKnowledgeResult,
  isNextQuestionResult,
} from "@/lib/ai/structured";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { resetAmanahAIProvider } from "@/lib/ai/ai-provider";
import { POST as nextQuestionPOST } from "@/app/api/ai/next-question/route";
import { POST as completionReviewPOST } from "@/app/api/ai/completion-review/route";
import { POST as extractPOST } from "@/app/api/ai/extract/route";
import { POST as familyMessagePOST } from "@/app/api/ai/family-message/route";
import { POST as knowledgePOST } from "@/app/api/ai/knowledge/route";
import { GET as aiStatusGET } from "@/app/api/ai/status/route";

describe("AI safety guardrails", () => {
  it("classifies legal questions", () => {
    expect(classifyUserIntent("Ist mein Testament rechtlich gültig?")).toBe("validity");
    expect(classifyUserIntent("Brauche ich einen Anwalt für Erbrecht?")).toBe("legal");
  });

  it("classifies medical and fatwa questions", () => {
    expect(classifyUserIntent("Welche Behandlung soll ich nehmen?")).toBe("treatment");
    expect(classifyUserIntent("Ist das islamisch erlaubt — Fatwa?")).toBe("fatwa");
  });

  it("blocks forbidden intents", () => {
    const r = enforceAiSafety("Wie kann ich meine Erbanteile nach islamischem Recht berechnen?", "knowledge");
    expect(r.allowed).toBe(false);
    expect(r.redirectMessage).toContain("Fachperson");
  });

  it("allows general organize questions", () => {
    const r = enforceAiSafety("Hilf mir meine Notfallkarte zu ordnen", "knowledge");
    expect(r.allowed).toBe(true);
  });

  it("provides safe response templates", () => {
    expect(safeResponseTemplate("fatwa")).toContain("Fatwa");
    expect(safeResponseTemplate("legal")).toContain("Rechtsberatung");
  });
});

describe("Rule-based AI provider", () => {
  it("returns next question with field path", async () => {
    const r = await ruleBasedAIProvider.nextQuestion(defaultAmanahData);
    expect(isNextQuestionResult(r)).toBe(true);
    expect(r.question.length).toBeGreaterThan(10);
    expect(r.fieldPath).toBeTruthy();
  });

  it("returns completion review", async () => {
    const r = await ruleBasedAIProvider.completionReview(defaultAmanahData);
    expect(isCompletionReviewResult(r)).toBe(true);
    expect(r.critical.length).toBeGreaterThan(0);
  });

  it("extracts contact from free text", async () => {
    const r = await ruleBasedAIProvider.extract(
      defaultAmanahData,
      "Meine Schwester Fatima soll zuerst angerufen werden unter 0176 12345678"
    );
    expect(isExtractResult(r)).toBe(true);
    expect(r.suggestedUpdates.some((s) => s.fieldPath.includes("emergencyContact1.name"))).toBe(true);
  });

  it("generates family message without auto-send", async () => {
    const r = await ruleBasedAIProvider.familyMessage(demoAmanahData, "kurz");
    expect(r.message).toContain("Notfall");
    expect(r.disclaimer).toContain("Versand");
  });

  it("blocks fatwa via knowledge safety in API layer", async () => {
    const r = await ruleBasedAIProvider.knowledge("Was sagt der Quran zur Erbschaft?");
    expect(isKnowledgeResult(r)).toBe(true);
    expect(r.blocked).toBe(false);
  });
});

describe("Mock AI provider", () => {
  it("implements all core features", async () => {
    const nq = await mockAIProvider.nextQuestion(defaultAmanahData);
    expect(nq.question).toBeTruthy();
    const cr = await mockAIProvider.completionReview(defaultAmanahData);
    expect(cr.summary).toBeTruthy();
  });
});

describe("AI context builder", () => {
  it("sanitizes sensitive keys", () => {
    const out = sanitizeForAi({ name: "Test", passwordHash: "secret", token: "x" });
    expect(out.name).toBe("Test");
    expect("passwordHash" in out).toBe(false);
    expect("token" in out).toBe(false);
  });

  it("minimizes next question context", () => {
    const ctx = buildNextQuestionContext(demoAmanahData);
    expect(ctx.progress.length).toBeGreaterThan(0);
    expect(JSON.stringify(ctx).length).toBeLessThan(5000);
  });

  it("limits extract context", () => {
    const long = "a".repeat(3000);
    const ctx = buildExtractContext(defaultAmanahData, long);
    expect(ctx.freeText.length).toBeLessThanOrEqual(2000);
  });

  it("knowledge context has no personal data", () => {
    const ctx = buildKnowledgeContext("Was ist Janazah?");
    expect(Object.keys(ctx)).toEqual(["question"]);
  });

  it("family message context excludes full data", () => {
    const ctx = buildFamilyMessageContext(demoAmanahData);
    expect(ctx).not.toHaveProperty("debtsAmanah");
    expect(ctx).not.toHaveProperty("digitalLegacy");
  });
});

describe("AI API routes", () => {
  beforeEach(() => {
    resetAmanahAIProvider();
    delete process.env.AMANAH_AI_ENABLED;
    process.env.AMANAH_AI_PROVIDER = "rules";
    delete process.env.OPENAI_API_KEY;
  });

  it("returns AI status", async () => {
    const res = await aiStatusGET();
    const body = await res.json();
    expect(body.enabled).toBe(true);
    expect(body.provider).toBe("rules");
    expect(body.requiresExternalConsent).toBe(false);
  });

  it("POST /api/ai/next-question", async () => {
    const res = await nextQuestionPOST(
      new Request("http://localhost/api/ai/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: defaultAmanahData }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.question).toBeTruthy();
    expect(body.provider).toBe("rules");
  });

  it("POST /api/ai/completion-review", async () => {
    const res = await completionReviewPOST(
      new Request("http://localhost/api/ai/completion-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: defaultAmanahData }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.critical).toBeDefined();
  });

  it("POST /api/ai/extract requires free text", async () => {
    const res = await extractPOST(
      new Request("http://localhost/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: defaultAmanahData }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/ai/extract with text", async () => {
    const res = await extractPOST(
      new Request("http://localhost/api/ai/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: defaultAmanahData,
          freeText: "Meine Schwester Fatima soll zuerst kontaktiert werden",
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestedUpdates?.length).toBeGreaterThan(0);
  });

  it("POST /api/ai/family-message", async () => {
    const res = await familyMessagePOST(
      new Request("http://localhost/api/ai/family-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: demoAmanahData, tone: "kurz" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toBeTruthy();
  });

  it("POST /api/ai/knowledge blocks legal questions", async () => {
    const res = await knowledgePOST(
      new Request("http://localhost/api/ai/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Ist mein Testament rechtlich gültig?" }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.blocked).toBe(true);
    expect(body.message).toContain("Fachperson");
  });

  it("requires consent when openai provider active", async () => {
    process.env.AMANAH_AI_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    resetAmanahAIProvider();

    const res = await nextQuestionPOST(
      new Request("http://localhost/api/ai/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: defaultAmanahData }),
      })
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.requiresConsent).toBe(true);
  });
});
