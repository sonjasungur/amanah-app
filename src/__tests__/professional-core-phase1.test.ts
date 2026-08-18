import { describe, it, expect, afterEach } from "vitest";
import { computeCheckResult, isContextProfileQuestion, pickPrimaryRecommendation } from "@/lib/check/results";
import { CHECK_QUESTIONS } from "@/lib/check/questions";
import { mergeCheckProgressIntoFolder, hasCheckProgress, CHECK_PROGRESS_VERSION } from "@/lib/check/progress";
import { defaultAmanahData } from "@/lib/domain/defaults";
import { migrateRawData } from "@/lib/domain/migration";
import { getDashboardGreeting } from "@/lib/plan/greeting";
import { getPlanNextStep } from "@/lib/plan/next-step";
import { isAiEnabled } from "@/lib/ai/config";
import { handleAiRoute } from "@/lib/ai/api-handler";
import { isPublicRegistrationEnabled } from "@/lib/auth/public-registration";
import { POST as registerPOST } from "@/app/api/auth/register/route";
import { funeralPartners } from "@/lib/mock/funeral-partners";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(process.cwd());
function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function allNoPrep(extra: Record<string, boolean> = {}) {
  const answers: Record<string, boolean> = {};
  for (const q of CHECK_QUESTIONS) {
    answers[q.id] = false;
  }
  return { ...answers, ...extra };
}

describe("professional core phase 1 — check evaluation", () => {
  it("does not treat profile context answers as gaps", () => {
    const r = computeCheckResult({
      convert: true,
      "family-muslim": false,
      married: false,
      "trust-muslim": true,
      "family-knows-islam": true,
      patientenverfuegung: true,
      vollmacht: true,
      "notfall-contact": true,
      janazah: true,
      burial: true,
      bestatter: true,
      schulden: true,
      testament: true,
      digital: true,
      sadaqa: true,
    });
    expect(r.missing.some((m) => m.id === "convert")).toBe(false);
    expect(r.missing.some((m) => m.id === "family-muslim")).toBe(false);
    expect(r.missing.some((m) => m.id === "married")).toBe(false);
    expect(r.prepared).not.toContain("Konvertit·in");
    expect(CHECK_QUESTIONS.filter(isContextProfileQuestion).map((q) => q.id)).toEqual([
      "convert",
      "family-muslim",
      "married",
    ]);
  });

  it("shows convert recommendations only when the profile matches", () => {
    const convert = computeCheckResult({ convert: true, "family-muslim": false });
    expect(convert.personalizedHints.some((h) => h.toLowerCase().includes("nicht-muslimisch"))).toBe(true);

    const notConvert = computeCheckResult({ convert: false, "family-muslim": false });
    expect(notConvert.personalizedHints.some((h) => h.toLowerCase().includes("nicht-muslimisch"))).toBe(false);
    expect(notConvert.personalizedHints.some((h) => h.toLowerCase().includes("konvert"))).toBe(false);
  });

  it("returns exactly one primary recommendation", () => {
    const r = computeCheckResult(allNoPrep());
    expect(r.nextSteps).toHaveLength(1);
    expect(r.primaryRecommendation.href).toBe("/dashboard/notfallkarte");
    expect(pickPrimaryRecommendation({ "notfall-contact": true, "trust-muslim": false }).id).toBe("vollmacht");
    expect(pickPrimaryRecommendation({ "notfall-contact": true, "trust-muslim": true, vollmacht: true, janazah: false }).id).toBe("janazah");
    expect(pickPrimaryRecommendation({ "notfall-contact": true, "trust-muslim": true, vollmacht: true, janazah: true }).id).toBe("plan");
  });

  it("shows at most three prioritized tasks and hides the rest", () => {
    const r = computeCheckResult(allNoPrep());
    expect(r.visibleTasks.length).toBeLessThanOrEqual(3);
    expect(r.furtherTasks.length).toBeGreaterThan(0);
    expect(r.visibleTasks.length + r.furtherTasks.length).toBe(r.missing.length);
  });
});

describe("professional core phase 1 — check persistence", () => {
  it("adopts versioned check progress without overwriting folder data", () => {
    const existing = {
      ...defaultAmanahData,
      emergencyCard: { ...defaultAmanahData.emergencyCard, name: "Amina Bestehend" },
    };
    const merged = mergeCheckProgressIntoFolder(existing, {
      schemaVersion: CHECK_PROGRESS_VERSION,
      index: 15,
      answers: { convert: true, "notfall-contact": false },
      phase: "result",
      completedAt: "2026-08-18T00:00:00.000Z",
    });
    expect(merged.emergencyCard.name).toBe("Amina Bestehend");
    expect(hasCheckProgress(merged.checkProgress)).toBe(true);
    expect(merged.checkProgress.answers.convert).toBe(true);
  });

  it("migrates legacy folder JSON and adds checkProgress without dropping names", () => {
    const migrated = migrateRawData({
      schemaVersion: 2,
      emergencyCard: { name: "Yusuf" },
    });
    expect(migrated.emergencyCard.name).toBe("Yusuf");
    expect(migrated.checkProgress.phase).toBe("intro");
    expect(migrated.schemaVersion).toBeGreaterThanOrEqual(3);
  });
});

describe("professional core phase 1 — dashboard greeting and next step", () => {
  it("never greets with dort", () => {
    expect(getDashboardGreeting("")).toBe("Willkommen bei Mein Wille");
    expect(getDashboardGreeting("   ")).toBe("Willkommen bei Mein Wille");
    expect(getDashboardGreeting("dort")).toBe("Willkommen bei Mein Wille");
    expect(getDashboardGreeting("Dort")).toBe("Willkommen bei Mein Wille");
    expect(getDashboardGreeting("Amina")).toBe("Willkommen, Amina");
    expect(getDashboardGreeting("Amina")).not.toMatch(/dort/i);
  });

  it("dashboard next step uses the check recommendation when completed", () => {
    const data = mergeCheckProgressIntoFolder(defaultAmanahData, {
      schemaVersion: 1,
      index: 15,
      answers: allNoPrep({ "notfall-contact": false }),
      phase: "result",
    });
    const next = getPlanNextStep(data);
    expect(next.path).toBe("/dashboard/notfallkarte");
    expect(next.title).toBeTruthy();
  });
});

describe("professional core phase 1 — AI default and consent", () => {
  const prevAi = process.env.AMANAH_AI_ENABLED;

  afterEach(() => {
    if (prevAi === undefined) delete process.env.AMANAH_AI_ENABLED;
    else process.env.AMANAH_AI_ENABLED = prevAi;
  });

  it("disables AI by default", () => {
    delete process.env.AMANAH_AI_ENABLED;
    delete process.env.AI_ENABLED;
    expect(isAiEnabled()).toBe(false);
  });

  it("rejects AI requests that send folder data without consent", async () => {
    process.env.AMANAH_AI_ENABLED = "true";
    const res = await handleAiRoute(
      new Request("http://localhost/api/ai/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: defaultAmanahData }),
      }),
      "next-question",
      async () => ({ ok: true })
    );
    expect(res.status).toBe(403);
  });
});

describe("professional core phase 1 — registration, funeral, brand-review, nav", () => {
  const prevAuth = process.env.NEXT_PUBLIC_AUTH_MODE;
  const prevReg = process.env.AMANAH_PUBLIC_REGISTRATION_ENABLED;

  afterEach(() => {
    if (prevAuth === undefined) delete process.env.NEXT_PUBLIC_AUTH_MODE;
    else process.env.NEXT_PUBLIC_AUTH_MODE = prevAuth;
    if (prevReg === undefined) delete process.env.AMANAH_PUBLIC_REGISTRATION_ENABLED;
    else process.env.AMANAH_PUBLIC_REGISTRATION_ENABLED = prevReg;
  });

  it("can disable public registration server-side in API mode", async () => {
    process.env.NEXT_PUBLIC_AUTH_MODE = "api";
    delete process.env.AMANAH_PUBLIC_REGISTRATION_ENABLED;
    delete process.env.NEXT_PUBLIC_AMANAH_PUBLIC_REGISTRATION_ENABLED;
    expect(isPublicRegistrationEnabled()).toBe(false);

    const res = await registerPOST(
      new Request("http://localhost/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "blocked@test.de", password: "secret12", name: "Blocked" }),
      })
    );
    expect(res.status).toBe(403);
  });

  it("has no verified mock funeral directors", () => {
    expect(funeralPartners).toEqual([]);
    expect(funeralPartners.some((p) => p.verified)).toBe(false);
    expect(read("src/lib/mock/funeral-partners.ts")).not.toContain("example.com");
  });

  it("does not expose /brand-review in production", () => {
    expect(read("src/app/brand-review/page.tsx")).toContain("notFound()");
    expect(read("src/app/brand-review/page.tsx")).toContain("index: false");
    expect(read("src/lib/flags/internal-tools.ts")).toContain('NODE_ENV === "development"');
  });

  it("shows only one mobile main navigation control", () => {
    const header = read("src/components/layout/header.tsx");
    const dash = read("src/components/dashboard/dashboard-layout.tsx");
    expect(header).toContain("site-mobile-nav-toggle");
    expect(dash).not.toContain("Navigation öffnen");
    expect(dash).toContain("hidden lg:block");
  });
});
