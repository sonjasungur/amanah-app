import { describe, it, expect } from "vitest";
import { computeCheckResult } from "@/lib/check/results";
import { CHECK_QUESTIONS } from "@/lib/check/questions";

describe("computeCheckResult", () => {
  it("personalizes for convert with non-muslim family", () => {
    const r = computeCheckResult({
      convert: true,
      "family-muslim": false,
      married: false,
      "trust-muslim": false,
      "family-knows-islam": false,
    });
    expect(r.personalizedHints.some((h) => h.toLowerCase().includes("nicht-muslimisch"))).toBe(true);
    expect(r.nextSteps.some((s) => s.href === "/dashboard/familie")).toBe(true);
  });

  it("scores prep questions separately from profile", () => {
    const profileOnly: Record<string, boolean> = {};
    for (const q of CHECK_QUESTIONS.filter((q) => q.category === "profil")) {
      profileOnly[q.id] = true;
    }
    const r = computeCheckResult(profileOnly);
    expect(r.prepYesCount).toBe(0);
    expect(r.status).toBe("red");
  });
});
