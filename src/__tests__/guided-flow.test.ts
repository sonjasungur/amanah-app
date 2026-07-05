import { describe, it, expect } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import {
  GUIDED_QUESTION_PLAN,
  getQuestionPlanCount,
  getNextGuidedQuestion,
  markQuestionSkipped,
  parseGuidedAnswer,
  buildPatchPreview,
  applyConfirmedUpdates,
  validateUpdates,
  isAllowedFieldPath,
  ALLOWED_FIELD_PATHS,
} from "@/lib/guided-flow";
import { POST as nextPOST } from "@/app/api/guided-flow/next/route";
import { POST as parsePOST } from "@/app/api/guided-flow/parse-answer/route";
import { POST as applyPOST } from "@/app/api/guided-flow/apply/route";

describe("Question plan", () => {
  it("has at least 20 questions", () => {
    expect(getQuestionPlanCount()).toBeGreaterThanOrEqual(20);
  });

  it("prioritizes critical emergency contact first", () => {
    const next = getNextGuidedQuestion(defaultAmanahData);
    expect(next.question?.fieldPath).toBe("emergencyCard.emergencyContact1.name");
    expect(next.question?.critical).toBe(true);
  });

  it("covers key modules", () => {
    const modules = new Set(GUIDED_QUESTION_PLAN.map((q) => q.moduleId));
    expect(modules.has("notfallkarte")).toBe(true);
    expect(modules.has("krankheit")).toBe(true);
    expect(modules.has("vollmacht")).toBe(true);
    expect(modules.has("janazah")).toBe(true);
    expect(modules.has("digitaler-nachlass")).toBe(true);
    expect(modules.has("schulden-amanah")).toBe(true);
    expect(modules.has("familie")).toBe(true);
  });
});

describe("Flow engine skip/completed", () => {
  it("skips questions", () => {
    const skipped = markQuestionSkipped("gf-ec1-name", []);
    const next = getNextGuidedQuestion(defaultAmanahData, skipped);
    expect(next.question?.id).not.toBe("gf-ec1-name");
  });
});

describe("Answer parser", () => {
  it("parses Fatima contact answer", async () => {
    const r = await parseGuidedAnswer(
      defaultAmanahData,
      "gf-ec1-name",
      "Meine Schwester Fatima soll zuerst angerufen werden."
    );
    expect(r.suggestedUpdates.some((u) => u.fieldPath.includes("emergencyContact1.name"))).toBe(true);
    expect(r.previewItems.length).toBeGreaterThan(0);
  });

  it("parses phone number", async () => {
    const r = await parseGuidedAnswer(
      defaultAmanahData,
      "gf-ec1-phone",
      "0176 12345678"
    );
    expect(r.suggestedUpdates[0]?.value).toContain("0176");
  });

  it("blocks legal advice in answer", async () => {
    const r = await parseGuidedAnswer(
      defaultAmanahData,
      "gf-doc-location",
      "Ist mein Testament rechtlich gültig?"
    );
    expect(r.blocked).toBe(true);
  });
});

describe("Patch preview", () => {
  it("shows old and new values", () => {
    const items = buildPatchPreview(defaultAmanahData, [
      {
        fieldPath: "emergencyCard.emergencyContact1.name",
        label: "Notfallkontakt",
        value: "Fatima",
        confidence: "high",
        moduleId: "notfallkarte",
      },
    ]);
    expect(items[0].oldValue).toBe("");
    expect(items[0].newValue).toBe("Fatima");
    expect(items[0].status).toBe("safe");
  });
});

describe("Apply confirmed updates", () => {
  it("applies allowed field paths", () => {
    const { data, applied } = applyConfirmedUpdates(defaultAmanahData, [
      {
        fieldPath: "emergencyCard.emergencyContact1.name",
        label: "Name",
        value: "Fatima",
        confidence: "high",
        moduleId: "notfallkarte",
      },
    ]);
    expect(applied).toContain("emergencyCard.emergencyContact1.name");
    expect(data.emergencyCard.emergencyContact1.name).toBe("Fatima");
  });

  it("rejects disallowed paths", () => {
    const { rejected } = applyConfirmedUpdates(defaultAmanahData, [
      {
        fieldPath: "malicious.field",
        label: "Hack",
        value: "x",
        confidence: "high",
        moduleId: "notfallkarte",
      },
    ]);
    expect(rejected).toContain("malicious.field");
  });

  it("does not auto-apply without explicit updates array", () => {
    const before = defaultAmanahData.emergencyCard.emergencyContact1.name;
    expect(before).toBe("");
    const { valid, invalid } = validateUpdates([]);
    expect(valid.length).toBe(0);
    expect(invalid.length).toBe(0);
  });
});

describe("Field path allowlist", () => {
  it("allows known paths", () => {
    expect(isAllowedFieldPath("emergencyCard.emergencyContact1.name")).toBe(true);
  });

  it("blocks unknown paths", () => {
    expect(isAllowedFieldPath("userProfile.password")).toBe(false);
    expect(isAllowedFieldPath("schemaVersion")).toBe(false);
  });

  it("allowlist is non-empty", () => {
    expect(ALLOWED_FIELD_PATHS.size).toBeGreaterThan(20);
  });
});

describe("Guided flow API routes", () => {
  it("POST /api/guided-flow/next", async () => {
    const res = await nextPOST(
      new Request("http://localhost/api/guided-flow/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: defaultAmanahData }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.question).toBeTruthy();
    expect(body.flowProgress).toBeDefined();
  });

  it("POST /api/guided-flow/parse-answer", async () => {
    const res = await parsePOST(
      new Request("http://localhost/api/guided-flow/parse-answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: defaultAmanahData,
          questionId: "gf-ec1-name",
          answer: "Meine Schwester Fatima soll zuerst kontaktiert werden. Ihre Nummer ist 0176 123456.",
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.suggestedUpdates.length).toBeGreaterThan(0);
  });

  it("POST /api/guided-flow/apply rejects invalid paths", async () => {
    const res = await applyPOST(
      new Request("http://localhost/api/guided-flow/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: defaultAmanahData,
          confirmedUpdates: [
            { fieldPath: "evil.path", label: "x", value: "y", confidence: "high", moduleId: "notfallkarte" },
          ],
        }),
      })
    );
    expect(res.status).toBe(400);
  });

  it("POST /api/guided-flow/apply merges data", async () => {
    const res = await applyPOST(
      new Request("http://localhost/api/guided-flow/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: defaultAmanahData,
          confirmedUpdates: [
            {
              fieldPath: "emergencyCard.emergencyContact1.name",
              label: "Name",
              value: "Fatima",
              confidence: "high",
              moduleId: "notfallkarte",
            },
          ],
        }),
      })
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data.emergencyCard.emergencyContact1.name).toBe("Fatima");
  });
});
