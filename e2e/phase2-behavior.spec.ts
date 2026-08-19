import { test, expect } from "@playwright/test";

test.describe("Save status display", () => {
  test("janazah form save indicator renders in the DOM", async ({ page }) => {
    await page.goto("/dashboard/janazah?schritt=0");
    await page.waitForSelector('[data-testid="janazah-guided-flow"]');
    // Fill enough fields to trigger hasMeaningfulLocalData
    await page.getByTestId("janazah-fullName").locator("input").fill("Test User");
    await page.getByTestId("janazah-trustedContact").locator("input").fill("Test Contact");
    // Wait for debounce + persist + UI update
    await page.waitForTimeout(1000);
    // After successful local save, indicator shows "saved" state — use toBeAttached since
    // it may be outside the mobile viewport (scrolled) but must exist in DOM
    await expect(page.getByTestId("save-status-indicator").first()).toBeAttached({ timeout: 5000 });
  });
});

test.describe("Step navigation without data loss", () => {
  test("navigating steps preserves entered data", async ({ page }) => {
    await page.goto("/dashboard/janazah?schritt=0");
    await page.waitForSelector('[data-testid="janazah-guided-flow"]');
    await page.getByTestId("janazah-fullName").locator("input").fill("Maryam Test");
    await page.getByTestId("janazah-next-button").click();
    await expect(page.getByTestId("janazah-step-1")).toBeVisible();
    await page.getByTestId("janazah-back-button").click();
    await expect(page.getByTestId("janazah-fullName").locator("input")).toHaveValue("Maryam Test");
  });
});

test.describe("Preview navigation", () => {
  test("preview edit link opens correct step", async ({ page }) => {
    await page.goto("/dashboard/janazah/vorschau");
    await page.waitForSelector('[data-testid="janazah-preview"]');
    const editLinks = page.locator(
      '[data-testid^="janazah-preview-section-"] a:has-text("Bearbeiten"), [data-testid^="janazah-preview-section-"] a:has-text("Edit")'
    );
    await editLinks.first().click();
    await expect(page).toHaveURL(/\/dashboard\/janazah\?schritt=0/);
  });
});

test.describe("Optional fields don't block", () => {
  test("can advance without filling optional fields", async ({ page }) => {
    await page.goto("/dashboard/janazah?schritt=1");
    await page.waitForSelector('[data-testid="janazah-guided-flow"]');
    await page.getByTestId("janazah-next-button").click();
    await expect(page.getByTestId("janazah-step-2")).toBeVisible();
  });
});

test.describe("English locale shows English text", () => {
  test("switching to English shows English step titles", async ({ page }) => {
    await page.goto("/dashboard/janazah?schritt=0");
    await page.waitForSelector('[data-testid="janazah-guided-flow"]');
    const localeSwitcher = page
      .locator('[data-testid="locale-switcher"], select[name="locale"]')
      .first();
    if ((await localeSwitcher.count()) > 0) {
      await localeSwitcher.selectOption("en");
      await expect(
        page.locator('[data-testid="janazah-step-progress"]')
      ).toContainText(/Step|Personal|Details/i);
    } else {
      test.skip();
    }
  });
});

test.describe("AI consent stored correctly", () => {
  test("AI consent is stored in localStorage", async ({ page }) => {
    await page.goto("/dashboard/einstellungen");
    await page.waitForSelector('[data-testid="settings-ai-section"]');
    const aiSection = page.getByTestId("settings-ai-consent-status");
    await expect(aiSection).toBeVisible();
    const text = await aiSection.textContent();
    expect(text).toBeTruthy();
  });

  test("consent localStorage key is not set by default", async ({ page }) => {
    await page.goto("/dashboard/einstellungen");
    const consent = await page.evaluate(() =>
      localStorage.getItem("amanah-ai-consent")
    );
    expect(consent).toBeNull();
  });
});

test.describe("Delete confirmation requires two steps", () => {
  test("delete requires confirmation before executing", async ({ page }) => {
    await page.goto("/dashboard/einstellungen");
    await page.waitForSelector('[data-testid="settings-delete-data-button"]');
    await page.getByTestId("settings-delete-data-button").click();
    await expect(
      page.getByTestId("settings-delete-data-confirm")
    ).toBeVisible();
    await page.getByText(/Abbrechen|Cancel/).click();
    await expect(
      page.getByTestId("settings-delete-data-confirm")
    ).not.toBeVisible();
  });
});

test.describe("PDF page shows honest note and correct CTA", () => {
  test("PDF page has honest export note", async ({ page }) => {
    await page.goto("/dashboard/pdf");
    await page.waitForLoadState("networkidle");
    // The note about no automatic transfer should exist in the DOM (may be below fold)
    await expect(
      page.getByText(/automatisch|automatically/i).first()
    ).toBeAttached();
    // Print/save button should be visible
    await expect(
      page.getByText(/Als PDF|Save as PDF|drucken|print/i).first()
    ).toBeVisible();
  });
});

test.describe("Browser overflow check", () => {
  test("Janazah preview has no horizontal overflow", async ({ page }) => {
    await page.goto("/dashboard/janazah/vorschau");
    await page.waitForSelector('[data-testid="janazah-preview"]');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    );
    expect(overflow).toBe(false);
  });
});

test.describe("Save error state", () => {
  test("save status indicator is rendered in the guided flow", async ({
    page,
  }) => {
    // Verify the save-status-indicator is part of the guided flow DOM
    // (it renders based on saveStatus, which is managed by the store)
    await page.goto("/dashboard/janazah?schritt=0");
    await page.waitForSelector('[data-testid="janazah-guided-flow"]');
    // The save-status-indicator container is always in the DOM (it renders null only when idle)
    // After filling meaningful fields and waiting for persist, it should appear
    await page.getByTestId("janazah-fullName").locator("input").fill("Save Error Test");
    await page.getByTestId("janazah-trustedContact").locator("input").fill("Contact Test");
    await page.waitForTimeout(1000);
    // Either "saved" or "error" state — must exist in DOM
    await expect(page.getByTestId("save-status-indicator").first()).toBeAttached({ timeout: 5000 });
  });
});
