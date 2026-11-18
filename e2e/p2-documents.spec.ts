import { test, expect, type Page } from "@playwright/test";

/** P2.2 documents in local mode with the synthetic demo folder. */

async function loadDemo(page: Page) {
  await page.goto("/dashboard/einstellungen");
  await page.waitForLoadState("networkidle");
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: /Demo-Daten laden/ }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("amanah-ordner-data") ?? "")).toContain("Ahmed Demo");
}

async function pdfPages(page: Page): Promise<number> {
  const pdf = await page.pdf({ preferCSSPageSize: true, printBackground: true });
  return (pdf.toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
}

test.describe("P2.2 documents", () => {
  test.skip(({ browserName }) => browserName !== "chromium", "PDF output needs Chromium");

  test("the emergency card prints as one A4 page, without the form around it", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium-desktop", "page.pdf once is enough");
    await loadDemo(page);
    await page.goto("/dashboard/notfallkarte");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("doc-preview-toggle").click();
    await expect(page.getByTestId("doc-preview-notfallkarte")).toContainText("Ahmed Demo");
    await page.evaluate(() => (document.body.dataset.printDoc = "notfallkarte"));
    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("doc-print-notfallkarte")).toBeVisible();
    await expect(page.getByLabel("Name", { exact: true })).toBeHidden();
    await expect(page.getByRole("button", { name: /Drucken/ })).toBeHidden();
    expect(await pdfPages(page)).toBe(1);
  });

  test("empty documents are not offered as finished; filled ones print German values only", async ({ page }) => {
    await page.goto("/dashboard/pdf");
    await page.waitForLoadState("networkidle");
    await page.getByTestId("export-familienbrief").getByRole("button").click();
    await expect(page.getByTestId("doc-empty")).toBeVisible();
    await expect(page.getByTestId("doc-print")).toHaveCount(0);
    await loadDemo(page);
    await page.goto("/dashboard/pdf?dokument=janazah");
    await page.waitForLoadState("networkidle");
    const preview = page.getByTestId("doc-preview-janazah");
    await expect(preview).toContainText("Janazah-Wünsche");
    await expect(preview).toContainText("Keine rechtliche Verfügung");
    expect(await preview.textContent()).not.toMatch(/\b(no|yes|unsure|true|false|undefined|null)\b/);
    await expect(page.getByTestId("doc-print")).toBeEnabled();
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });

  test("health details only after their own confirmation", async ({ page }) => {
    await loadDemo(page);
    await page.goto("/dashboard/pdf?dokument=notfallinfo");
    await page.waitForLoadState("networkidle");
    const preview = page.getByTestId("doc-preview-notfallinfo");
    await expect(preview).not.toContainText("Medizinische Hinweise");
    await page.getByTestId("doc-include-health").click();
    await expect(page.getByTestId("doc-include-health")).not.toBeChecked();
    await expect(preview).not.toContainText("Medizinische Hinweise");
    await page.getByTestId("doc-health-yes").click();
    await expect(page.getByTestId("doc-include-health")).toBeChecked();
    await expect(preview).toContainText("Medizinische Hinweise");
  });

  test("every document with data turns into a printable A4 document", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium-desktop", "page.pdf once is enough");
    await loadDemo(page);
    for (const id of ["notfallkarte", "notfallinfo", "janazah", "erbprofil", "schulden", "gesamt"]) {
      await page.goto(`/dashboard/pdf?dokument=${id}`);
      await page.waitForLoadState("networkidle");
      await expect(page.getByTestId(`doc-print-${id}`)).toBeAttached();
      await page.evaluate((d) => (document.body.dataset.printDoc = d), id);
      const pages = await pdfPages(page);
      expect(pages, id).toBeGreaterThanOrEqual(1);
      expect(pages, id).toBeLessThanOrEqual(id === "gesamt" ? 8 : 3);
      await page.evaluate(() => delete document.body.dataset.printDoc);
    }
  });
});
