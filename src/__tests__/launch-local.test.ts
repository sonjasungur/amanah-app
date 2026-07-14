import { describe, it, expect } from "vitest";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { demoAmanahData } from "@/lib/domain/demo-data";
import { buildFamilyLetterTemplate } from "@/lib/export/family-letter-template";
import { wissenTopics } from "@/lib/knowledge/wissen-topics";
import { getNextGuidedQuestion, resolveQuestion } from "@/lib/guided-flow/flow-engine";

describe("Family letter template", () => {
  it("generates a non-empty letter without AI", () => {
    const letter = buildFamilyLetterTemplate(demoAmanahData);
    expect(letter).toContain("Liebe Familie");
    expect(letter.toLowerCase()).toContain("keine rechtsberatung");
    expect(letter.length).toBeGreaterThan(200);
  });

  it("works with empty data", () => {
    const letter = buildFamilyLetterTemplate(defaultAmanahData);
    expect(letter).toContain("[Dein Name]");
    expect(letter).toContain("noch offen");
  });
});

describe("Wissen topics", () => {
  it("has 12 rich topics with required sections", () => {
    expect(wissenTopics.length).toBe(14);
    for (const topic of wissenTopics) {
      expect(topic.details?.whyImportant).toBeTruthy();
      expect(topic.details?.prepareItems.length).toBeGreaterThan(2);
      expect(topic.details?.nextStepHref).toMatch(/^\/dashboard\//);
    }
  });
});

describe("Guided flow restore", () => {
  it("resolves persisted question id from catalog", () => {
    const q = resolveQuestion("gf-ec1-name");
    expect(q?.questionText).toContain("Notfall");
  });

  it("returns first question for empty data", () => {
    const next = getNextGuidedQuestion(defaultAmanahData);
    expect(next.done).toBe(false);
    expect(next.question).not.toBeNull();
  });
});
