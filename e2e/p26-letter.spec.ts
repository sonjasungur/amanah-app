/**
 * P2.6 family letter and dates, local mode: write, save, find it again, see it ready, preview, print
 * on several pages; a template never replaces a text without asking; an unfinished birth date is
 * named instead of being printed silently.
 */
import { test, expect, type Page } from "@playwright/test";

const pdfPages = async (page: Page) => ((await page.pdf({ preferCSSPageSize: true, printBackground: true })).toString("latin1").match(/\/Type\s*\/Page[^s]/g) ?? []).length;
const PARAGRAPH = "Ich habe lange überlegt, was ich euch sagen möchte, und habe es aufgeschrieben, damit ihr es in Ruhe lesen könnt, wann immer ihr es braucht. ";

test("family letter: write, save, reopen, ready in Meine Dokumente, preview and a multi-page PDF", async ({ page, browserName }, info) => {
  await page.goto("/dashboard/familie");
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 1 }).first()).toContainText("Brief an meine Familie");
  await page.getByTestId("letter-greeting").fill("Meine Lieben,");
  const body = Array.from({ length: 14 }, (_, i) => `Absatz ${i + 1}. ${PARAGRAPH.repeat(3)}`).join("\n\n");
  await page.getByTestId("letter-body").fill(body);
  await page.getByTestId("letter-closing").fill("In Liebe");
  await page.getByTestId("letter-signature").fill("Eure Mutter");
  await expect(page.getByTestId("letter-word-count")).toContainText("Wörter");
  await page.getByTestId("save-bar-save").click();
  await expect(page.getByTestId("save-bar")).toHaveAttribute("data-state", "gespeichert");

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("letter-body")).toHaveValue(body);
  await expect(page.getByTestId("letter-closing")).toHaveValue("In Liebe");

  await page.goto("/dashboard/pdf");
  await page.waitForLoadState("networkidle");
  const card = page.getByTestId("export-familienbrief");
  await expect(card).toContainText("Bereit");
  await expect(page.getByTestId("printout-meta-familienbrief")).toContainText(/Angaben zuletzt geändert: \d{2}\.\d{2}\.\d{4}/);
  await card.getByRole("button", { name: "Vorschau ansehen" }).click();
  await expect(page).toHaveURL(/dokument=familienbrief/);
  const preview = page.getByTestId("doc-preview-familienbrief");
  await expect(preview).toBeInViewport();
  await expect(preview.locator(".letter-greeting")).toHaveText("Meine Lieben,");
  await expect(preview.locator(".letter-body p")).toHaveCount(14);

  if (browserName === "chromium" && info.project.name === "chromium-desktop") {
    await page.evaluate(() => (document.body.dataset.printDoc = "familienbrief"));
    await page.emulateMedia({ media: "print" });
    expect(await pdfPages(page)).toBeGreaterThanOrEqual(2);
    // The signature block stays together on one page.
    await expect(page.getByTestId("doc-print-familienbrief").locator(".letter-sign")).toHaveCSS("break-inside", "avoid");
  }
});

test("a template never replaces a written letter without asking, and can be undone", async ({ page }) => {
  await page.goto("/dashboard/familie");
  await page.waitForLoadState("networkidle");
  await page.getByTestId("letter-body").fill("Mein eigener Text, den ich nicht verlieren möchte.");
  await page.getByTestId("letter-template").click();
  await expect(page.getByTestId("letter-replace-confirm")).toBeVisible();
  await expect(page.getByTestId("letter-body")).toHaveValue("Mein eigener Text, den ich nicht verlieren möchte.");
  await page.getByTestId("letter-replace-yes").click();
  await expect(page.getByTestId("letter-body")).not.toHaveValue("Mein eigener Text, den ich nicht verlieren möchte.");
  await page.getByTestId("letter-undo").click();
  await expect(page.getByTestId("letter-body")).toHaveValue("Mein eigener Text, den ich nicht verlieren möchte.");
});

test("empty letter: not offered as finished, leads to the editor", async ({ page }) => {
  await page.goto("/dashboard/pdf?dokument=familienbrief");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("export-familienbrief")).toContainText("Noch keine Angaben");
  await expect(page.getByTestId("doc-empty")).toBeVisible();
  await expect(page.getByTestId("doc-empty").getByRole("link", { name: "Angaben ergänzen" })).toHaveAttribute("href", "/dashboard/familie");
});

test("birth date: the full date reaches the document; an unfinished or impossible draft stays open until corrected or discarded (F1, owner acceptance)", async ({ page }) => {
  page.on("dialog", (d) => void d.accept()); // the browser's own "leave page?" on reload
  await page.goto("/dashboard/notfallkarte");
  await page.waitForLoadState("networkidle");
  await page.getByLabel("Name", { exact: true }).fill("Datumstest Beispiel");
  const date = page.getByLabel("Geburtsdatum");
  await date.click();
  await page.keyboard.type("03071962");
  await expect(date).toHaveValue("03.07.1962");
  await page.goto("/dashboard/pdf?dokument=notfallkarte");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("doc-print-notfallkarte")).toContainText("03.07.1962");
  await expect(page.locator(".doc-print-root .doc-card-body").first()).toContainText("geb. 03.07.1962");

  // Overwritten with an unfinished and then an impossible date: named at the field, not stored.
  await page.goto("/dashboard/notfallkarte");
  await page.waitForLoadState("networkidle");
  for (const [digits, message] of [["0307", "Geburtsdatum noch unvollständig"], ["31021962", "Bitte gib ein gültiges Geburtsdatum ein"]]) {
    await date.click();
    await page.keyboard.press("ControlOrMeta+a");
    await page.keyboard.type(digits);
    await page.getByLabel("Name", { exact: true }).click();
    await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
    await expect(date).toHaveAttribute("aria-invalid", "true");
    await expect(page.getByTestId("save-bar")).toHaveAttribute("data-state", "korrektur");
  }
  // The draft stays the person's input, also after a reload; the old date is neither shown nor exported.
  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(date).toHaveValue("31.02.1962");
  await page.goto("/dashboard/pdf?dokument=notfallkarte");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("draft-notice")).toBeVisible();
  await expect(page.getByTestId("doc-preview-notfallkarte")).not.toContainText("03.07.1962");
  await expect(page.getByTestId("doc-pdf")).toBeDisabled();
  // Only an explicit discard brings the stored date back.
  await page.getByTestId("draft-notice").getByTestId("draft-discard").click();
  await expect(page.getByTestId("draft-notice")).toHaveCount(0);
  await expect(page.locator(".doc-print-root .doc-card-body").first()).toContainText("geb. 03.07.1962");
  await page.goto("/dashboard/notfallkarte");
  await page.waitForLoadState("networkidle");
  await expect(date).toHaveValue("03.07.1962");
});

test("birth date: an unfinished date stored by an older version is shown for correction and not printed (F1)", async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem("seeded")) return;
    localStorage.setItem("amanah-ordner-data", JSON.stringify({ state: { emergencyCard: { name: "Datumstest Beispiel", birthDate: "03.07." } }, version: 0 }));
    sessionStorage.setItem("seeded", "1");
  });
  await page.goto("/dashboard/notfallkarte");
  await page.waitForLoadState("networkidle");
  // Shown at once after loading at the field. It is the stored value, not an open draft: nothing to discard.
  await expect(page.getByRole("alert").filter({ hasText: "Geburtsdatum noch unvollständig" })).toBeVisible();
  await expect(page.getByTestId("date-discard")).toHaveCount(0);
  await page.goto("/dashboard/pdf?dokument=notfallkarte");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("doc-gaps")).toContainText("Geburtsdatum ist unvollständig");
  await expect(page.getByTestId("export-notfallkarte")).toContainText("Bitte prüfen");
  await expect(page.locator(".doc-print-root .doc-card-body").first()).not.toContainText("geb.");
});
