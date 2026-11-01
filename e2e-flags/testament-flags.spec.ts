import { expect, test, type Page } from "@playwright/test";

/**
 * Runs only against the isolated build (npm run build:e2e:flags): both locked flags are on.
 * Even then the rule set is unreviewed, so no share may appear.
 */
const ANSWERS = {
  inheritanceProfile: { married: true, spouseAlive: true, sons: 1, daughters: 1, siblings: false, stepchildren: false, fosterChildren: false, nonMuslimRelatives: false, desiredWasiyyah: "alles an meinen Sohn" },
  assets: [{ id: "a1", type: "bank", description: "Girokonto Testbank", locationHint: "Ordner im Flur", approximateValue: "12345", notes: "Geheime Notiz" }],
  testamentPreparation: {
    currentStep: 0,
    legalFacts: { maritalStatus: "verheiratet", differentReligionRelatives: "nein" },
    islamicModel: {
      wantsIslamicDistribution: "ja",
      ownGender: "male",
      fatherAlive: "nein",
      motherAlive: "nein",
      grandparentsAlive: "nein",
      grandchildrenViaDeceasedSon: "nein",
      halfSiblings: "nein",
      adoptedChildren: "nein",
      moreThanOneSpouse: "nein",
    },
  },
};

async function seed(page: Page) {
  await page.addInitScript((state) => {
    if (!localStorage.getItem("seeded")) {
      localStorage.setItem("seeded", "1");
      localStorage.setItem("amanah-ordner-data", JSON.stringify({ state, version: 0 }));
    }
  }, ANSWERS);
}

async function openStep(page: Page, id: string) {
  await page.goto("/dashboard/testament/vorbereitung");
  const step = page.getByTestId(`preparation-step-${id}`);
  // Clicks before hydration do nothing, so keep going until the wanted step is reached.
  await expect(async () => {
    if (!(await step.isVisible())) await page.getByTestId("preparation-next").click({ timeout: 1000 });
    await expect(step).toBeVisible({ timeout: 100 });
  }).toPass({ intervals: [50], timeout: 25_000 });
}

async function goToSummary(page: Page) {
  const summary = page.getByTestId("preparation-summary");
  await expect(async () => {
    if (!(await summary.isVisible())) await page.getByTestId("preparation-next").click({ timeout: 1000 });
    await expect(summary).toBeVisible({ timeout: 100 });
  }).toPass({ intervals: [50], timeout: 25_000 });
}

test.describe("testament preparation with the development flag on", () => {
  test.beforeEach(async ({ page }) => {
    await seed(page);
  });

  test("opens the questionnaire instead of the lock", async ({ page }) => {
    await page.goto("/dashboard/testament/vorbereitung");
    await expect(page.getByTestId("preparation-progress")).toBeVisible();
    await expect(page.getByTestId("testament-preparation-locked")).toHaveCount(0);
    await expect(page.getByText("Hier entsteht kein Testament.")).toBeVisible();
  });

  test("a wish can be added, edited and removed and stays non-binding", async ({ page }) => {
    await openStep(page, "bequests");
    const editor = page.getByTestId("bequest-editor");
    await expect(page.getByTestId("bequest-non-binding")).toContainText("Unverbindliche Wünsche zur fachlichen Prüfung");
    await expect(page.getByTestId("bequest-percent-note")).toHaveCount(0);

    await editor.getByLabel("Was?").selectOption("percent");
    await expect(page.getByTestId("bequest-percent-note")).toContainText("§ 2087 BGB");
    await editor.getByLabel("Anteil in Prozent").fill("10");
    await editor.getByLabel("Für wen?").fill("Moschee Test");
    await page.getByTestId("bequest-add").click();
    await expect(page.getByTestId("bequest-list")).toContainText("10 %");

    await page.getByRole("button", { name: "Wunsch für Moschee Test bearbeiten" }).click();
    await expect(editor.getByLabel("Anteil in Prozent")).toHaveValue("10");
    await editor.getByLabel("Anteil in Prozent").fill("12,5");
    await page.getByTestId("bequest-add").click();
    await expect(page.getByTestId("bequest-list").locator("li")).toHaveCount(1);
    await expect(page.getByTestId("bequest-list")).toContainText("12,5 %");
    await expect(page.getByTestId("bequest-edit-cancel")).toHaveCount(0);

    await page.reload();
    await expect(page.getByTestId("bequest-list")).toContainText("12,5 %");

    await page.getByRole("button", { name: "Wunsch für Moschee Test entfernen" }).click();
    await expect(page.getByTestId("bequest-list")).toHaveCount(0);
  });

  test("the conversation paper keeps wishes, questions and inventory apart and shows no share", async ({ page }) => {
    await openStep(page, "bequests");
    const editor = page.getByTestId("bequest-editor");
    await editor.getByLabel("Was?").selectOption("percent");
    await editor.getByLabel("Anteil in Prozent").fill("20");
    await editor.getByLabel("Für wen?").fill("Moschee Test");
    await page.getByTestId("bequest-add").click();
    await goToSummary(page);

    const summary = page.getByTestId("preparation-summary");
    await expect(summary).toContainText("Gesprächsunterlage – kein Testament");
    await expect(page.getByTestId("bequest-summary")).toContainText("Unverbindliche Wünsche zur fachlichen Prüfung");
    await expect(page.getByTestId("bequest-percent-note")).toContainText("§ 2087 BGB");
    await expect(page.getByTestId("preparation-lawyer-questions")).toContainText("§ 2087 BGB");

    await expect(page.getByTestId("faraid-locked")).toContainText("gesperrt");
    await expect(page.getByTestId("faraid-model-result")).toHaveCount(0);
    await expect(page.getByTestId("bequest-scholar-questions")).toHaveCount(0);

    const annex = page.getByTestId("preparation-assets");
    await expect(annex).toContainText("Anlage: Vermögensbestandsaufnahme (keine Verfügung)");
    await expect(annex).toContainText("Girokonto Testbank");
    await expect(annex).toContainText("kein Testament");
    await expect(annex).not.toContainText("12345");
    await expect(annex).not.toContainText("Geheime Notiz");
    await expect(annex).not.toContainText("Moschee Test");
    await expect(page.getByTestId("bequest-summary")).not.toContainText("Girokonto");

    await page.emulateMedia({ media: "print" });
    await expect(annex).toBeVisible();
    await expect(annex.getByRole("link")).toBeHidden();
    await expect(page.getByRole("button", { name: "Antworten ändern" })).toBeHidden();
    await expect(page.getByTestId("plus-area-notice")).toBeHidden();
    await expect(page.getByText("Lokaler Demo-Modus")).toBeHidden();
    await expect(annex).toHaveCSS("break-before", "page");
    expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
  });

  test("the traffic light appears only with its own flag and still calls itself no check", async ({ page }) => {
    await page.goto("/dashboard/testament");
    await expect(page.getByText(/Erste Hinweise:/)).toBeVisible();
    await expect(page.getByText(/Automatische Stichwort-Hinweise, keine Prüfung/)).toBeVisible();
    await expect(page.getByTestId("inheritance-conversation-points")).toHaveCount(0);
  });
});
