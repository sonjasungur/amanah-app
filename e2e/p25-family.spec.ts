/**
 * P2.5-D: a recorded family conversation is part of the folder. Local mode: it survives a reload and
 * shows up on the completion page (step 3) and, with open tasks, in the family guide.
 */
import { test, expect } from "@playwright/test";

test("a family conversation is kept, summarised on the completion page and in the guide", async ({ page }) => {
  await page.goto("/dashboard/personen");
  await page.waitForLoadState("networkidle");
  await page.evaluate(() => {
    const raw = JSON.parse(localStorage.getItem("amanah-ordner-data") ?? '{"state":{},"version":0}');
    raw.state = { ...raw.state, familyMembers: [{ id: "p1", name: "Yusuf Beispiel", relation: "Sohn", roles: ["vertrauensperson"] }] };
    localStorage.setItem("amanah-ordner-data", JSON.stringify(raw));
  });
  await page.goto("/dashboard/familiengespraech");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("talk-no-power")).toContainText("keine Vollmacht");
  await page.getByTestId("talk-add").click();
  const card = page.getByTestId("talk-card").first();
  await card.getByLabel("Yusuf Beispiel").check();
  await card.getByLabel("Vertrauensperson").check();
  await card.getByLabel("Testament").check();
  await card.getByTestId("talk-explained").selectOption("ja");
  await card.getByTestId("talk-add-task").click();
  await card.getByLabel("Aufgabe 1: wer").fill("Yusuf");
  await card.getByLabel("Aufgabe 1: was").fill("Bestatter-Vertrag abholen");
  await card.getByTestId("talk-open").fill("Grabstelle noch klären");
  await page.getByTestId("save-bar-save").click();
  await expect(page.getByTestId("save-bar")).toHaveAttribute("data-state", "gespeichert");

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("talk-card")).toHaveCount(1);
  await expect(page.getByTestId("talk-open")).toHaveValue("Grabstelle noch klären");

  await page.goto("/dashboard/vorsorge/abschluss");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("completion-steps").locator("li")).toHaveCount(5);
  const talks = page.getByTestId("completion-family-talks");
  await expect(talks).toContainText("Yusuf Beispiel");
  await expect(talks).toContainText("Bestatter-Vertrag abholen");
  await expect(talks).toContainText("Testament");
  await expect(talks).toContainText("Aufbewahrungsort erklärt: Ja");
  await expect(page.getByTestId("completion-people")).not.toContainText("Noch kein Gespräch festgehalten");
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);

  await page.getByTestId("completion-guide-cta").click();
  await expect(page.getByTestId("doc-preview-leitfaden")).toContainText("Wer was übernommen hat");
  await expect(page.getByTestId("doc-preview-leitfaden")).toContainText("Bestatter-Vertrag abholen");
});
