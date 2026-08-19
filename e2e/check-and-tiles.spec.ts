import { test, expect } from "@playwright/test";

const WISSEN_SLUGS = [
  "notfallkarte",
  "patientenverfuegung",
  "vorsorgevollmacht",
  "janazah-wuensche",
  "testament-erbe",
  "sadaqa-jariya",
  "barzakh",
  "akhira-vorsorge",
];

test.describe("Homepage guided path", () => {
  test("primary CTA starts the Amanah-Check", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: /Kostenlosen Amanah-Check starten/i }).first().click();
    await expect(page).toHaveURL(/\/check$/);
  });

  test("homepage has no anonymous dashboard module jumps", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("home-area-janazah")).toHaveCount(0);
    await expect(page.getByTestId("document-logo-mark")).toBeVisible();
  });
});

test.describe("Vorsorge-Check", () => {
  async function waitForCheckReady(page: import("@playwright/test").Page) {
    await page.goto("/check");
    await expect(page.getByTestId("check-loading")).toBeHidden({ timeout: 8000 });
  }

  test("fresh browser shows intro then first question", async ({ page }) => {
    await waitForCheckReady(page);
    await expect(page.getByTestId("check-intro")).toBeVisible({ timeout: 5000 });
    await page.getByTestId("check-start").click();
    await expect(page.getByTestId("check-question-text")).toBeVisible({ timeout: 5000 });
    await expect(page.getByTestId("check-progress-label")).toContainText("Frage 1");
  });

  test("continued check restores question from sessionStorage", async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem(
        "amanah-check-progress-v3",
        JSON.stringify({ index: 2, answers: { convert: true, married: false }, phase: "questions" })
      );
    });
    await waitForCheckReady(page);
    await expect(page.getByTestId("check-question-text")).toBeVisible({ timeout: 8000 });
    await expect(page.getByTestId("check-progress-label")).toContainText("Frage 3");
  });
});

test.describe("Internal wissen links", () => {
  for (const slug of WISSEN_SLUGS) {
    test(`/wissen/${slug} is blocked until reviewed`, async ({ page }) => {
      const response = await page.goto(`/wissen/${slug}`);
      expect(response?.status()).toBe(404);
      await expect(page.getByText(/Seite nicht gefunden|Page not found/i)).toBeVisible();
    });
  }
});

test.describe("Mobile layout smoke", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test("homepage has no horizontal overflow", async ({ page }) => {
    await page.goto("/");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
    expect(overflow).toBe(false);
  });

  test("wissen page loads on mobile", async ({ page }) => {
    await page.goto("/wissen");
    await expect(page.getByPlaceholder("Worüber möchtest du mehr wissen?")).toBeVisible();
  });

  test("only one mobile main navigation toggle is present", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page.getByTestId("site-mobile-nav-toggle")).toBeVisible();
    await expect(page.getByRole("button", { name: /Navigation öffnen/i })).toHaveCount(0);
  });
});
