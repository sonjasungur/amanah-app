import { test, expect, type Page } from "@playwright/test";

/** P2.4 in local mode with synthetic demo data. */
async function loadDemo(page: Page) {
  await page.goto("/dashboard/einstellungen");
  await page.waitForLoadState("networkidle");
  page.once("dialog", (d) => void d.accept());
  await page.getByRole("button", { name: /Demo-Daten laden/ }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("amanah-ordner-data") ?? "")).toContain("Ahmed Demo");
}

test("completion: what happens now, people to tell, review date kept after reload", async ({ page }) => {
  await loadDemo(page);
  await page.goto("/dashboard/vorsorge/abschluss");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("completion-handover")).toContainText("Persönliche Angaben vollständig");
  await expect(page.getByTestId("completion-people")).toContainText("Demo");
  await expect(page.getByTestId("completion-access")).toContainText("noch nicht verfügbar");
  await page.getByTestId("completion-mark-reviewed").click();
  await expect(page.getByTestId("completion-reviewed")).toContainText("zuletzt am");
  await page.waitForTimeout(600);
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("completion-reviewed")).toContainText("zuletzt am");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});

test("family guide is reachable from the completion page and prints as a document", async ({ page }) => {
  await loadDemo(page);
  await page.goto("/dashboard/vorsorge/abschluss");
  await page.getByTestId("completion-guide-cta").click();
  await expect(page).toHaveURL(/dokument=leitfaden/);
  const preview = page.getByTestId("doc-preview-leitfaden");
  await expect(preview).toContainText("Was soll meine Familie im Notfall tun?");
  await expect(preview).toContainText("Notruf 112");
  await expect(page.getByTestId("doc-print")).toBeEnabled();
});

test("homepage says what is free, what Plus is and what still waits for review", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("home-free")).toContainText("Kostenlos");
  await expect(page.getByTestId("home-plus")).toContainText("In Vorbereitung");
  await expect(page.getByTestId("home-komplett")).toContainText("nach juristischer Prüfung");
  await expect(page.getByTestId("home-pending")).toContainText("Später");
  await expect(page.getByTestId("home-availability")).toContainText("noch nicht kaufen");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
});
