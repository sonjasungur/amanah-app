/**
 * Very long input must not freeze the page: one word of a million characters once took browsers
 * minutes to wrap. Nothing may be cut off. Runs in every build, also on the phone profile.
 */
import { expect, test, type Page } from "@playwright/test";

const LONG_WORD = "x".repeat(1_900_000);

/** The page still answers within this time. Generous for slow machines, far below the old hang. */
const RESPONSIVE_MS = 8_000;

async function answers(page: Page) {
  await expect(async () => {
    await page.evaluate(() => new Promise((resolve) => requestAnimationFrame(resolve)));
  }).toPass({ timeout: RESPONSIVE_MS });
}

test.describe("very long input", () => {
  test.setTimeout(60_000);

  test("pasting one huge word from the clipboard keeps the page usable and the whole text", async ({ page, context, baseURL }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: baseURL });
    await page.goto("/dashboard/notfallkarte");
    const field = page.getByLabel("Allergien");
    await field.click();
    await page.evaluate((text) => navigator.clipboard.writeText(text), LONG_WORD);
    await page.keyboard.press("ControlOrMeta+V");
    await expect.poll(() => field.evaluate((e: HTMLTextAreaElement) => e.value.length), { timeout: RESPONSIVE_MS }).toBe(LONG_WORD.length);
    await answers(page);
    await page.waitForTimeout(800);

    await page.reload();
    await expect.poll(() => field.evaluate((e: HTMLTextAreaElement) => e.value.length), { timeout: RESPONSIVE_MS }).toBe(LONG_WORD.length);
    await answers(page);
  });

  test("the printed view stays usable, and normal text wraps again after shortening", async ({ page }) => {
    await page.goto("/dashboard/notfallkarte");
    const field = page.getByLabel("Allergien");
    await field.fill(LONG_WORD);
    await page.waitForTimeout(800);

    await page.emulateMedia({ media: "print" });
    await answers(page);
    await page.goto("/dashboard/pdf");
    await answers(page);
    await page.emulateMedia({ media: "screen" });

    await page.goto("/dashboard/notfallkarte");
    await field.fill("Erdnüsse und Pollen");
    await expect(field).toHaveCSS("white-space", "pre-wrap");
  });

  test("long ordinary text keeps wrapping", async ({ page }) => {
    await page.goto("/dashboard/notfallkarte");
    const field = page.getByLabel("Allergien");
    await field.fill("Erdnuss, ".repeat(200_000));
    await answers(page);
    await expect(field).toHaveCSS("white-space", "pre-wrap");
  });

  test("the notes in the family conversation use the same protection", async ({ page }) => {
    await page.goto("/dashboard/familiengespraech");
    // The first topic is open from the start.
    const notes = page.getByLabel("Eigene Notizen").first();
    await notes.fill(LONG_WORD);
    await answers(page);
    await expect(notes).toHaveValue(LONG_WORD);
  });
});
