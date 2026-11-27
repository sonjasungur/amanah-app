/**
 * AP22 Welle 2 Teil A, local mode: power-of-attorney wishes with old texts kept (EA-07), digital
 * legacy with secret check and migration (EA-18.1), wording help for the family letter (EA-17.1),
 * and the ⓘ help module on Ghusl & Kafan (EA-01.3).
 */
import { test, expect, type Page } from "@playwright/test";

const KEY = "amanah-ordner-data";

/** An old folder (first version): free texts in the power of attorney, old digital entries. */
async function seedOldFolder(page: Page) {
  await page.addInitScript((key) => {
    if (sessionStorage.getItem("seeded")) return;
    sessionStorage.setItem("seeded", "1");
    const state = {
      schemaVersion: 3,
      familyMembers: [{ id: "p1", name: "Amina Beispiel", relation: "Schwester", relationType: "geschwister", roles: ["vertrauensperson"] }],
      powerOfAttorney: {
        authorizedPerson: "",
        substitutePerson: "",
        medical: "ja",
        authorities: "",
        bank: "Nur Girokonto",
        housing: "",
        care: "",
        burial: "Mein Bruder kümmert sich",
        documents: "",
        digitalAccounts: "Netflix kündigen",
        excludedPersons: "",
      },
      digitalLegacy: [
        { id: "a", type: "email", description: "Gmail-Hauptkonto", locationHint: "Notfall-Kit im Schrank" },
        { id: "b", type: "password_manager", description: "1Password", locationHint: "Master-Passwort: Sonne123" },
      ],
    };
    localStorage.setItem(key, JSON.stringify({ state, version: 0 }));
  }, KEY);
}

const stored = (page: Page) => page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "{}").state, KEY);

test("EA-07: power-of-attorney wishes keep the old texts and save the new structure", async ({ page }) => {
  await seedOldFolder(page);
  await page.goto("/dashboard/vollmacht");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("poa-not-effective")).toContainText("Deine Wünsche – keine wirksame Vollmacht");
  await expect(page.getByTestId("poa-legacy-bank")).toContainText("Nur Girokonto");
  await expect(page.getByTestId("poa-legacy-burial")).toContainText("Mein Bruder kümmert sich");
  await expect(page.getByTestId("poa-burial-note").getByRole("link")).toHaveAttribute("href", "/dashboard/janazah");
  await expect(page.getByTestId("poa-scope-split")).toBeChecked();
  await expect(page.getByTestId("poa-area-mail")).toBeVisible();

  await page.getByTestId("poa-person-authorizedPerson").locator("select").selectOption("p1");
  await page.getByTestId("poa-area-finance").locator("select").first().selectOption("none");
  await page.getByTestId("poa-notes").fill("Bitte mit meiner Familie absprechen.");
  await expect
    .poll(async () => {
      const s = await stored(page);
      return [s.powerOfAttorney.authorizedPerson, s.powerOfAttorney.wishes?.areas?.finance?.holder, s.powerOfAttorney.bank, s.powerOfAttorney.wishes?.additionalNotes];
    })
    .toEqual(["Amina Beispiel", "none", "Nur Girokonto", "Bitte mit meiner Familie absprechen."]);

  await page.reload();
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("poa-notes")).toHaveValue("Bitte mit meiner Familie absprechen.");
  await expect(page.getByTestId("poa-legacy-bank")).toContainText("Nur Girokonto");
});

test("EA-18.1: digital legacy migrates old entries and refuses passwords", async ({ page }) => {
  await seedOldFolder(page);
  await page.goto("/dashboard/digitaler-nachlass");
  await page.waitForLoadState("networkidle");
  await expect(page.getByTestId("digital-entry")).toHaveCount(2);
  await expect(page.getByTestId("digital-legacy-note").first()).toContainText("Gmail-Hauptkonto");
  await expect(page.getByTestId("digital-secret-warning")).toHaveCount(1);

  await page.getByTestId("digital-known-provider").selectOption("netflix");
  await page.getByTestId("digital-reference").fill("Kundennummer 12345678");
  await expect(page.getByTestId("digital-error-reference")).toBeVisible();
  await expect(page.getByTestId("digital-save")).toBeDisabled();
  await page.getByTestId("digital-reference").fill("Familienabo");
  await page.getByTestId("digital-person").selectOption("p1");
  await page.getByLabel("Kündigen").check();
  await page.getByTestId("digital-secure-access").selectOption("trusted_person_knows");
  await page.getByTestId("digital-save").click();
  await expect(page.getByTestId("digital-entry")).toHaveCount(3);

  await page.getByTestId("digital-take-from-poa").click();
  await expect(page.getByTestId("digital-entry")).toHaveCount(4);
  await expect
    .poll(async () => {
      const s = await stored(page);
      return [s.digitalLegacy.length, s.digitalLegacy[0].description, s.digitalLegacy[1].locationHint, s.powerOfAttorney.digitalAccounts];
    })
    .toEqual([4, "Gmail-Hauptkonto", "Master-Passwort: Sonne123", "Netflix kündigen"]);
});

test("EA-17.1: a wording help is taken into the letter with one click", async ({ page }) => {
  await page.goto("/dashboard/familie");
  await page.waitForLoadState("networkidle");
  await page.getByTestId("letter-body").fill("Liebe Familie,");
  await page.getByTestId("letter-phrases").locator("summary").click();
  await expect(page.getByTestId("letter-phrases-notice")).toHaveText("Kein Testament – rechtlich bindende Verfügungen gehören ins Testament.");
  await page.getByTestId("letter-phrases").getByText("Geschwister", { exact: true }).click();
  const phrase = page.getByTestId("letter-phrase").first();
  const text = (await phrase.innerText()).replace(/^Übernehmen:\s*/, "").trim();
  await phrase.click();
  await expect(page.getByTestId("letter-body")).toHaveValue(`Liebe Familie,\n\n${text}`);
});

test("EA-01.3: the ⓘ help opens on Ghusl & Kafan and shows the review status", async ({ page }) => {
  await page.goto("/dashboard/ghusl-kafan");
  await page.waitForLoadState("networkidle");
  const button = page.getByRole("button", { name: "Erklärung: Wer darf anwesend sein?" });
  await expect(button).toHaveAttribute("aria-expanded", "false");
  await button.click();
  await expect(button).toHaveAttribute("aria-expanded", "true");
  await expect(page.getByTestId("field-help-pruefstatus")).toHaveText("Noch nicht fachlich geprüft");
  await expect(page.getByTestId("field-help-begriff")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(button).toHaveAttribute("aria-expanded", "false");
});
