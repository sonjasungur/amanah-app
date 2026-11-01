import { test, expect } from "@playwright/test";

test.describe("Meine Vorsorge: Dokumente und Personen", () => {
  test("document status and location survive a reload", async ({ page }) => {
    await page.goto("/dashboard/dokumente");
    const testament = page.getByTestId("document-testament");
    await testament.getByLabel("Status").selectOption("vorhanden");
    await testament.getByLabel("Wo liegt das Original?").fill("Amtsgericht, amtliche Verwahrung");
    await expect(page.getByTestId("documents-summary")).toContainText("1 von 10 vorhanden");
    await page.reload();
    await expect(page.getByTestId("document-testament").getByLabel("Wo liegt das Original?")).toHaveValue("Amtsgericht, amtliche Verwahrung");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });

  test("people can be added with roles and removed", async ({ page }) => {
    await page.goto("/dashboard/personen");
    await page.getByLabel("Name").fill("Yusuf Test");
    await page.getByLabel("Beziehung").selectOption("geschwister");
    await page.getByLabel("Notfallkontakt").check();
    await page.getByTestId("person-add").click();
    await expect(page.getByTestId("person-list")).toContainText("Yusuf Test");
    await expect(page.getByTestId("person-list")).toContainText("Notfallkontakt");
    await page.reload();
    await expect(page.getByTestId("person-list")).toContainText("Yusuf Test");
    await page.getByRole("button", { name: "Yusuf Test entfernen" }).click();
    await expect(page.getByTestId("person-list")).not.toContainText("Yusuf Test");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });

  test("assets can be listed without amounts and survive a reload", async ({ page }) => {
    await page.goto("/dashboard/testament");
    const overview = page.getByTestId("asset-overview");
    // A selection made before hydration is lost: repeat it until the form has reacted.
    await expect(async () => {
      await overview.getByLabel("Art").selectOption("real_estate");
      await expect(overview.getByLabel("Eigentum")).toBeVisible({ timeout: 500 });
    }).toPass();
    await overview.getByLabel("Adresse oder Bezeichnung").fill("Testweg 1");
    await overview.getByLabel("Eigentum").selectOption("gemeinsam");
    await page.getByTestId("asset-add").click();
    await expect(page.getByTestId("asset-list")).toContainText("Testweg 1");
    await expect(page.getByTestId("asset-list")).toContainText("Eigentum: Gemeinsam");
    await page.reload();
    await expect(page.getByTestId("asset-list")).toContainText("Testweg 1");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });
});
