import { test, expect } from "@playwright/test";

/** P2 forms in local mode: date typing, password eye, contextual help. Synthetic input only. */

test("birth date: dots appear while typing, paste of an ISO date works, a wrong date is explained", async ({ page }) => {
  await page.goto("/dashboard/notfallkarte");
  await page.waitForLoadState("networkidle");
  const date = page.getByLabel("Geburtsdatum");
  await date.click();
  await page.keyboard.type("15031985");
  await expect(date).toHaveValue("15.03.1985");
  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await expect(date).toHaveValue("15.03.19");
  await page.keyboard.type("80");
  await expect(date).toHaveValue("15.03.1980");
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByLabel("Geburtsdatum")).toHaveValue("15.03.1980");
  await page.getByLabel("Geburtsdatum").fill("1979-12-01");
  await expect(page.getByLabel("Geburtsdatum")).toHaveValue("01.12.1979");
  await page.getByLabel("Geburtsdatum").fill("31.02.1980");
  await page.getByLabel("Name", { exact: true }).click();
  await expect(page.getByRole("alert").filter({ hasText: "Dieses Datum gibt es nicht" })).toBeVisible();
  const size = await page.getByLabel("Geburtsdatum").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  expect(size).toBeGreaterThanOrEqual(16);
});

test("password eye on registration and login, by mouse and keyboard", async ({ page }) => {
  for (const path of ["/register", "/login"]) {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const field = page.getByPlaceholder("••••••••");
    await field.fill("geheim-12345");
    await expect(field).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: "Passwort anzeigen" }).click();
    await expect(field).toHaveAttribute("type", "text");
    await expect(field).toHaveValue("geheim-12345");
    await page.getByRole("button", { name: "Passwort verbergen" }).focus();
    await page.keyboard.press("Enter");
    await expect(field).toHaveAttribute("type", "password");
  }
});

test("contextual help opens next to the term and closes with Escape", async ({ page }) => {
  await page.goto("/dashboard/ghusl-kafan");
  await page.waitForLoadState("networkidle");
  const help = page.getByRole("button", { name: "Hilfe: Ghusl" }).first();
  await help.click();
  const panel = page.getByRole("region", { name: "Erklärung: Ghusl" });
  await expect(panel).toContainText("Was du einträgst");
  await expect(panel).toContainText("keine Rechts- oder Fatwa-Beratung");
  await page.keyboard.press("Escape");
  await expect(panel).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});
