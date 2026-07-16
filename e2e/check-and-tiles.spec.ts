import { test, expect } from "@playwright/test";

const HOME_TILES = [
  { testId: "home-area-notfallkarte", path: "/dashboard/notfallkarte" },
  { testId: "home-area-vollmacht", path: "/dashboard/vollmacht" },
  { testId: "home-area-janazah", path: "/dashboard/janazah" },
  { testId: "home-area-testament", path: "/dashboard/testament" },
  { testId: "home-area-digitaler-nachlass", path: "/dashboard/digitaler-nachlass" },
  { testId: "home-area-familie", path: "/dashboard/familie" },
];

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

test.describe("Homepage tiles", () => {
  for (const { testId, path } of HOME_TILES) {
    test(`tile ${testId} navigates to ${path}`, async ({ page }) => {
      await page.goto("/");
      await page.getByTestId(testId).click();
      await expect(page).toHaveURL(new RegExp(`${path.replace("/", "\\/")}$`));
    });
  }
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
    test(`/wissen/${slug} returns 200`, async ({ page }) => {
      const response = await page.goto(`/wissen/${slug}`);
      expect(response?.status()).toBe(200);
      await expect(page.getByText("In 30 Sekunden")).toBeVisible();
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
});
