import { test, expect } from "@playwright/test";

/** P2.5-A in local mode: a clear save action, its state and time, and the way back to the overview. */
test("emergency card: save to the folder, see when, find it again after reload", async ({ page }) => {
  await page.goto("/dashboard/notfallkarte");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Name", { exact: true }).fill("Speichertest Beispiel");
  const bar = page.getByTestId("save-bar");
  await bar.getByTestId("save-bar-save").click();
  await expect(bar).toHaveAttribute("data-state", "gespeichert");
  await expect(page.getByTestId("save-bar-time")).toContainText(/Zuletzt gespeichert in diesem Browser: \d{2}\.\d{2}\.\d{4}/);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Speichertest Beispiel");
  // The save action comes before preview, PDF and print.
  const order = await page.evaluate(() => {
    const save = document.querySelector('[data-testid="save-bar-save"]');
    const pdf = document.querySelector('[data-testid="doc-pdf"]');
    return Boolean(save && pdf && save.compareDocumentPosition(pdf) & Node.DOCUMENT_POSITION_FOLLOWING);
  });
  expect(order).toBe(true);
  await page.getByTestId("save-bar-save-overview").click();
  await expect(page).toHaveURL(/\/dashboard$/);
});

test("every input page has the save area", async ({ page }) => {
  for (const path of ["/dashboard/personen", "/dashboard/dokumente", "/dashboard/vermoegen", "/dashboard/schulden-amanah", "/dashboard/krankheit", "/dashboard/vorsorge", "/dashboard/janazah"]) {
    await page.goto(path);
    await expect(page.getByTestId("save-bar"), path).toBeVisible();
  }
});
