import { afterEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ALWAYS_FREE_ACCOUNT_RIGHTS, PLAN_FEATURES, featureForRoute, featuresByTier } from "@/lib/billing/plan-matrix";
import { resolvePlusAccess, resolvePlusAccessByFeature } from "@/lib/billing/plus-access";
import { readFileSync } from "node:fs";
import { getProducts } from "@/lib/billing/products";
import { moduleConfigs } from "@/lib/modules/config";
import { validateProductionEnv } from "@/lib/server/production-config";

const env = (vars: Record<string, string>) => vars as unknown as NodeJS.ProcessEnv;

describe("free / Plus matrix", () => {
  it("keeps the knowledge centre, information and the check free and never lockable", () => {
    for (const route of ["/wissen", "/wissen/islam/x", "/testament-erbe", "/janazah-kompass", "/check"]) {
      const feature = featureForRoute(route);
      expect(feature?.tier, route).toBe("free");
      expect(feature?.enforcement, route).toBe("never");
    }
  });

  it("puts the planned Plus areas into Plus", () => {
    const plus = featuresByTier("plus").map((f) => f.id);
    expect(plus).toEqual(["persistent_folder", "family_people", "documents_overview", "estate_debts", "personal_wishes", "pdf_exports"]);
    expect(featureForRoute("/dashboard/dokumente")?.id).toBe("documents_overview");
    expect(featureForRoute("/dashboard/notfallkarte")?.tier).toBe("free");
  });

  it("assigns every dashboard area to exactly one plan feature", () => {
    for (const mod of moduleConfigs) {
      expect(featureForRoute(mod.path), mod.path).not.toBeNull();
    }
    const routes = PLAN_FEATURES.flatMap((f) => f.routes);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it("lists data subject rights as always free and the catalog follows the matrix", () => {
    expect(ALWAYS_FREE_ACCOUNT_RIGHTS.join(" ")).toMatch(/export.*Löschen/i);
    const plus = getProducts().find((p) => p.id === "vorsorge_plus")!;
    expect(plus.testPriceCents).toBe(3900);
    expect(plus.features).toEqual(featuresByTier("plus").map((f) => f.title));
  });
});

describe("Plus access without surprise removal", () => {
  const launch = "2026-12-01T00:00:00Z";

  it("locks nothing while enforcement is off", () => {
    expect(resolvePlusAccess({ accountCreatedAt: null, paidPlus: false }, env({}))).toEqual({ allowed: true, reason: "not_enforced" });
  });

  it("keeps everything for accounts created before the launch", () => {
    const e = env({ AMANAH_BILLING_ENFORCE: "true", AMANAH_PLUS_LAUNCH_AT: launch });
    expect(resolvePlusAccess({ accountCreatedAt: "2026-11-30T23:59:59Z", paidPlus: false }, e)).toEqual({ allowed: true, reason: "existing_account" });
    expect(resolvePlusAccess({ accountCreatedAt: "2026-12-02T00:00:00Z", paidPlus: false }, e)).toEqual({ allowed: false, reason: "none" });
    expect(resolvePlusAccess({ accountCreatedAt: "2026-12-02T00:00:00Z", paidPlus: true }, e)).toEqual({ allowed: true, reason: "purchase" });
    expect(resolvePlusAccess({ accountCreatedAt: null, paidPlus: false }, e).allowed).toBe(false);
  });

  it("grandfathers only the scope that existed before the launch", () => {
    const e = env({ AMANAH_BILLING_ENFORCE: "true", AMANAH_PLUS_LAUNCH_AT: launch });
    for (const f of PLAN_FEATURES) expect(typeof f.availableBeforeLaunch, f.id).toBe("boolean");
    const existing = { accountCreatedAt: "2026-11-01T00:00:00Z", paidPlus: false };
    const laterFeature = { ...featuresByTier("plus")[0], id: "added_after_launch", availableBeforeLaunch: false };
    expect(resolvePlusAccess({ ...existing, feature: featuresByTier("plus")[0] }, e).reason).toBe("existing_account");
    expect(resolvePlusAccess({ ...existing, feature: laterFeature }, e)).toEqual({ allowed: false, reason: "none" });
    expect(resolvePlusAccess({ ...existing, paidPlus: true, feature: laterFeature }, e).reason).toBe("purchase");
    const byFeature = resolvePlusAccessByFeature(existing, e);
    expect(Object.keys(byFeature)).toEqual(featuresByTier("plus").map((f) => f.id));
    expect(Object.values(byFeature).every((a) => a.reason === "existing_account")).toBe(true);
  });

  it("public texts promise only the pre-launch scope and offer no purchase", () => {
    const preise = readFileSync("src/app/preise/page.tsx", "utf8");
    expect(preise).toContain("die vor der Einführung von Vorsorge Plus verfügbar waren");
    expect(preise).not.toMatch(/behalten alle Funktionen/);
    const notice = readFileSync("src/components/billing/plus-area-notice.tsx", "utf8");
    expect(notice).not.toMatch(/<Button|checkout|kaufen/i);
    expect(readFileSync("src/app/dashboard/pdf/page.tsx", "utf8")).toContain('<PlusGate feature="pdf_exports">');
  });

  it("grandfathers every account when enforcement lacks a launch date, and production refuses that setup", () => {
    const e = env({ AMANAH_BILLING_ENFORCE: "true" });
    expect(resolvePlusAccess({ accountCreatedAt: "2030-01-01T00:00:00Z", paidPlus: false }, e).reason).toBe("existing_account");
    expect(validateProductionEnv(e).errors.join(" ")).toContain("AMANAH_PLUS_LAUNCH_AT");
  });
});

describe("internal concept page", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("renders the matrix with the 39 € test price and the grandfathering rules", async () => {
    vi.stubEnv("AMANAH_INTERNAL_TOOLS", "true");
    const { default: Page } = await import("@/app/intern/vorsorge-plus/page");
    const html = renderToStaticMarkup(Page());
    expect(html).toContain("KONZEPT");
    expect(html).toMatch(/plus-price">39\s€/);
    expect(html).toContain("Bestandsschutz");
    for (const f of PLAN_FEATURES) expect(html).toContain(`plan-feature-${f.id}`);
  });
});
