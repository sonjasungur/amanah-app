import { test, expect } from "@playwright/test";

const JANAZAH_SAMPLE = {
  fullName: "Amina Test",
  locationRegion: "Berlin",
  trustedContact: "Yusuf Test",
  preferredMosque: "Mevlana Moschee Berlin",
  messageToFamily: "Bitte Einheit in der Familie bewahren.",
};

test.describe("Janazah wishes persistence", () => {
  test("fill, save, reload and verify stored data with local storage hint", async ({ page }) => {
    await page.goto("/dashboard/janazah");
    await expect(page.getByTestId("janazah-guided-flow")).toBeVisible();

    await page.getByTestId("janazah-fullName").locator("input").fill(JANAZAH_SAMPLE.fullName);
    await page.getByTestId("janazah-locationRegion").locator("input").fill(JANAZAH_SAMPLE.locationRegion);
    await page.getByTestId("janazah-trustedContact").locator("input").fill(JANAZAH_SAMPLE.trustedContact);

    await page.getByTestId("janazah-next-button").click();
    await expect(page.getByTestId("janazah-step-progress")).toBeVisible({ timeout: 5000 });

    await page.goto("/dashboard/janazah?schritt=0");
    await expect(page.getByTestId("janazah-guided-flow")).toBeVisible();
    await expect(page.getByTestId("janazah-fullName").locator("input")).toHaveValue(JANAZAH_SAMPLE.fullName);
    await expect(page.getByTestId("janazah-locationRegion").locator("input")).toHaveValue(JANAZAH_SAMPLE.locationRegion);
  });

  test("navigates between janazah sections", async ({ page }) => {
    await page.goto("/dashboard/janazah");
    await expect(page.getByTestId("janazah-guided-flow")).toBeVisible();
    await expect(page.getByTestId("janazah-step-progress")).toBeVisible();
    await expect(page.getByTestId("janazah-next-button")).toBeVisible();
  });
});

test.describe("Vorsorgeplan dashboard", () => {
  test("shows greeting without dort and one next step", async ({ page }) => {
    await page.goto("/dashboard");
    const greeting = page.getByTestId("dashboard-greeting");
    await expect(greeting).toBeVisible();
    await expect(greeting).toHaveText("Willkommen bei Mein Wille");
    await expect(greeting).not.toContainText("dort");
    await expect(page.getByTestId("dashboard-next-step")).toBeVisible();
    await expect(page.getByTestId("dashboard-next-step-cta")).toBeVisible();
  });

  test("all care areas are reachable after expanding", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-module-tiles")).toBeVisible();
    await page.getByTestId("dashboard-all-areas-toggle").click();
    await expect(page.getByTestId("dashboard-tile-janazah")).toBeVisible();
  });
});

test.describe("Mobile UX and CTAs", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test("janazah form has no horizontal overflow on mobile", async ({ page }) => {
    await page.goto("/dashboard/janazah");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test("check CTA is the homepage primary action", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Kostenlosen Amanah-Check starten/i }).first()).toBeVisible();
  });

  test("pricing page shows check and login CTAs", async ({ page }) => {
    await page.goto("/preise");
    await expect(page.getByRole("link", { name: /Amanah-Check starten/i }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: /Anmelden/i }).first()).toBeVisible();
  });

  test("gespräch mit angehörigen is visible", async ({ page }) => {
    await page.goto("/dashboard/familiengespraech");
    await expect(page.getByRole("heading", { name: "Gespräch mit Angehörigen" })).toBeVisible();
    await expect(page.getByText("Berufsteilung")).toHaveCount(0);
  });
});

test.describe("Auth return URL in local mode", () => {
  test("login page preserves dashboard return URL in register link", async ({ page }) => {
    await page.goto("/login?returnUrl=%2Fdashboard%2Fjanazah");
    await expect(page.locator('a[href="/register?returnUrl=%2Fdashboard%2Fjanazah"]')).toBeVisible();
  });
});
