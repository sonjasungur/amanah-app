import { test, expect } from "@playwright/test";

const HOME_TILES = [
  { testId: "home-area-notfallkarte", path: "/dashboard/notfallkarte" },
  { testId: "home-area-vollmacht", path: "/dashboard/vollmacht" },
  { testId: "home-area-janazah", path: "/dashboard/janazah" },
  { testId: "home-area-testament", path: "/dashboard/testament" },
  { testId: "home-area-digitaler-nachlass", path: "/dashboard/digitaler-nachlass" },
  { testId: "home-area-familie", path: "/dashboard/familie" },
];

const JANAZAH_SAMPLE = {
  fullName: "Amina Test",
  locationRegion: "Berlin",
  trustedContact: "Yusuf Test",
  preferredMosque: "Mevlana Moschee Berlin",
  messageToFamily: "Bitte Einheit in der Familie bewahren.",
};

test.describe("Homepage tiles to modules", () => {
  for (const { testId, path } of HOME_TILES) {
    test(`tile ${testId} navigates to ${path}`, async ({ page }) => {
      await page.goto("/");
      await page.getByTestId(testId).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
    });
  }

  test("janazah tile opens structured form with module navigation", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("home-area-janazah").click();
    await expect(page.getByTestId("janazah-form")).toBeVisible();
    await expect(page.getByTestId("janazah-legal-notice")).toBeVisible();
    await expect(page.getByTestId("janazah-module-nav")).toBeVisible();
  });
});

test.describe("Janazah wishes persistence", () => {
  test("fill, save, reload and verify stored data with local storage hint", async ({ page }) => {
    await page.goto("/dashboard/janazah");
    await expect(page.getByTestId("janazah-form")).toBeVisible();

    await page.getByTestId("janazah-fullName").locator("input").fill(JANAZAH_SAMPLE.fullName);
    await page.getByTestId("janazah-locationRegion").locator("input").fill(JANAZAH_SAMPLE.locationRegion);
    await page.getByTestId("janazah-trustedContact").locator("input").fill(JANAZAH_SAMPLE.trustedContact);
    await page.getByTestId("janazah-preferredMosque").locator("input").fill(JANAZAH_SAMPLE.preferredMosque);
    await page.getByTestId("janazah-messageToFamily").locator("textarea").fill(JANAZAH_SAMPLE.messageToFamily);

    await page.getByTestId("janazah-save-button").click();
    await expect(page.getByTestId("janazah-save-success")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("janazah-save-success")).toContainText("auf diesem Gerät gespeichert");
    await expect(page.getByTestId("save-status-location")).toContainText("Nur auf diesem Gerät gespeichert");

    await page.reload();
    await expect(page.getByTestId("janazah-fullName").locator("input")).toHaveValue(JANAZAH_SAMPLE.fullName);
    await expect(page.getByTestId("janazah-locationRegion").locator("input")).toHaveValue(JANAZAH_SAMPLE.locationRegion);
    await expect(page.getByTestId("janazah-messageToFamily").locator("textarea")).toHaveValue(JANAZAH_SAMPLE.messageToFamily);
  });

  test("navigates between janazah sections", async ({ page }) => {
    await page.goto("/dashboard/janazah");
    await page.getByTestId("janazah-module-nav").getByRole("link", { name: /Ghusl/i }).click();
    await expect(page).toHaveURL(/\/dashboard\/ghusl-kafan$/);
    await expect(page.getByTestId("janazah-module-nav")).toBeVisible();
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

  test("register CTA is visible on homepage", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /Konto erstellen/i }).first()).toBeVisible();
  });

  test("pricing page shows register and login CTAs", async ({ page }) => {
    await page.goto("/preise");
    await expect(page.getByRole("link", { name: /Konto erstellen/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /Anmelden/i })).toBeVisible();
  });

  test("dashboard module tiles are visible", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-module-tiles")).toBeVisible();
    await expect(page.getByTestId("dashboard-tile-janazah")).toBeVisible();
  });
});

test.describe("Auth return URL in local mode", () => {
  test("login page preserves dashboard return URL in register link", async ({ page }) => {
    await page.goto("/login?returnUrl=%2Fdashboard%2Fjanazah");
    await expect(page.getByRole("link", { name: /Registrieren/i })).toHaveAttribute(
      "href",
      "/register?returnUrl=%2Fdashboard%2Fjanazah"
    );
  });
});
