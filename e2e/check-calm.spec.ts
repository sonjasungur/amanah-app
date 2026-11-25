import { test, expect, type Page } from "@playwright/test";

/**
 * Owner order 25.11.2026: the Vorsorge-Check must stay absolutely calm. Clicking Ja or Nein may change colours
 * and the question text, but the card, the answer buttons, the question area and the progress bar must not
 * move or change size — on desktop, tablet and phone.
 */
const PARTS = ['[data-testid="check-question"] .check-card', '[data-testid="check-answer-yes"]', '[data-testid="check-answer-no"]', '[role="progressbar"]', '[data-testid="check-question-text"]'] as const;

async function boxes(page: Page) {
  return page.evaluate((sel) => {
    return sel.map((s) => {
      const el = document.querySelector(s);
      if (!el) return "missing";
      const target = s.endsWith("check-question-text\"]") ? el.parentElement! : el;
      const r = target.getBoundingClientRect();
      return `${Math.round(r.top)}/${Math.round(r.left)}/${Math.round(r.width)}/${Math.round(r.height)}`;
    });
  }, [...PARTS]);
}

for (const vp of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "phone", width: 390, height: 844 },
]) {
  test(`check layout stays still on ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/check");
    await expect(page.getByTestId("check-loading")).toBeHidden({ timeout: 8000 });
    await page.getByTestId("check-start").click();
    await expect(page.getByTestId("check-question-text")).toBeVisible();
    await page.mouse.move(0, 0);

    const before = await boxes(page);
    expect(before).not.toContain("missing");
    for (const answer of ["check-answer-yes", "check-answer-no", "check-answer-yes", "check-answer-no"]) {
      await page.getByTestId(answer).click();
      // Right after the click (while the answer is being saved) and after the next question appeared.
      expect(await boxes(page)).toEqual(before);
      await expect(page.getByTestId("check-saving")).toHaveCount(0);
      await page.mouse.move(0, 0);
      expect(await boxes(page)).toEqual(before);
    }
    await expect(page.getByTestId("check-progress-label")).toContainText("Frage 5");
  });
}
