import { test, expect, type Page } from "@playwright/test";

/** Synthetic data only. Local mode: the folder lives in this browser profile. */

async function ready(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

async function noHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1)).toBe(false);
}

async function addPerson(page: Page, name: string, emergency = true) {
  const form = page.getByRole("heading", { name: "Person hinzufügen" }).locator("..");
  await form.getByLabel("Name").fill(name);
  await form.getByLabel("Beziehung zu dir").selectOption("geschwister");
  if (emergency) await form.getByLabel(/Notfallkontakt/).check();
  await page.getByTestId("person-add").click();
  await expect(page.getByTestId("person-list")).toContainText(name);
}

test.describe("P1: geführter Vorsorgeablauf", () => {
  test("one path with steps, back, and data that lands on the existing pages", async ({ page }) => {
    await ready(page, "/dashboard/vorsorge");
    await expect(page.getByTestId("flow-step-count")).toContainText("Schritt 1 von 13");
    await page.getByLabel("Dein Name").fill("Amina Beispiel");
    await page.getByTestId("flow-next").click();
    await expect(page.getByTestId("flow-step-count")).toContainText("Schritt 2 von 13");
    await addPerson(page, "Yusuf Beispiel");
    await page.getByTestId("flow-next").click();
    await expect(page.getByTestId("flow-step-title")).toHaveText("Wen soll man im Notfall anrufen?");
    await page.getByTestId("person-picker-emergencyContact1").getByRole("combobox").selectOption({ label: "Yusuf Beispiel (Bruder / Schwester)" });
    await page.getByTestId("flow-back").click();
    await expect(page.getByTestId("flow-step-count")).toContainText("Schritt 2 von 13");

    await ready(page, "/dashboard/notfallkarte");
    await expect(page.getByLabel("Name", { exact: true })).toHaveValue("Amina Beispiel");
    await expect(page.getByLabel("Notfallkontakt 1 — Name")).toHaveValue("Yusuf Beispiel");
  });

  test("pause, see it on the dashboard, and resume at the same step after a reload", async ({ page }) => {
    await ready(page, "/dashboard/vorsorge?schritt=vollmacht");
    await expect(page.getByTestId("flow-step-title")).toHaveText("Wer soll für dich handeln, wenn du es nicht kannst?");
    await page.getByTestId("flow-later").click();
    await expect(page).toHaveURL(/\/dashboard$/);
    await page.reload();
    await page.waitForLoadState("networkidle");
    const next = page.getByTestId("dashboard-next-step");
    await expect(next).toContainText("Schritt 6 von 13");
    await page.getByTestId("dashboard-next-step-cta").click();
    await expect(page.getByTestId("flow-step-title")).toHaveText("Wer soll für dich handeln, wenn du es nicht kannst?");
  });

  test("keyboard only: the next button is reachable and works", async ({ page }) => {
    await ready(page, "/dashboard/vorsorge");
    await page.getByTestId("flow-next").focus();
    await page.keyboard.press("Enter");
    await expect(page.getByTestId("flow-step-count")).toContainText("Schritt 2 von 13");
  });
});

test.describe("P1: Familie & Kontakte", () => {
  test("a person is entered once, used in the emergency card, and a change appears there too", async ({ page }) => {
    await ready(page, "/dashboard/personen");
    await addPerson(page, "Yusuf Beispiel");
    await ready(page, "/dashboard/notfallkarte");
    await page.getByTestId("person-picker-emergencyContact1").getByRole("combobox").selectOption({ label: "Yusuf Beispiel (Bruder / Schwester)" });
    await expect(page.getByLabel("Notfallkontakt 1 — Name")).toHaveValue("Yusuf Beispiel");

    await ready(page, "/dashboard/personen");
    await expect(page.getByTestId("person-usages")).toContainText("Notfallkarte (Kontakt 1)");
    await page.getByRole("button", { name: "Yusuf Beispiel bearbeiten" }).click();
    await page.getByTestId("person-item").getByLabel("Telefon (freiwillig)").fill("0151 0000 777");
    await page.getByTestId("person-save").click();
    await expect(page.getByTestId("person-item")).toHaveCount(1);

    await ready(page, "/dashboard/notfallkarte");
    await expect(page.getByLabel("Notfallkontakt 1 — Telefon")).toHaveValue("0151 0000 777");
  });

  test("a long family list stays usable", async ({ page }) => {
    await ready(page, "/dashboard/personen");
    for (let i = 1; i <= 12; i++) await addPerson(page, `Person Beispiel ${i} mit einem sehr langen Familiennamen Beispielmann-Musterfrau`, false);
    await expect(page.getByTestId("person-item")).toHaveCount(12);
    await noHorizontalOverflow(page);
  });
});

test.describe("P1: Dashboard und Abschluss", () => {
  test("status per area, last change and no legal claim", async ({ page }) => {
    await ready(page, "/dashboard");
    await expect(page.getByTestId("area-notfall")).toHaveAttribute("data-status", "nicht_begonnen");
    await expect(page.getByTestId("dashboard-summary")).toContainText("Über rechtliche");
    await ready(page, "/dashboard/vorsorge");
    await page.getByLabel("Dein Name").fill("Amina Beispiel");
    await ready(page, "/dashboard");
    await expect(page.getByTestId("area-notfall")).toHaveAttribute("data-status", "begonnen");
    await expect(page.getByTestId("area-notfall")).toContainText("Zuletzt geändert am");
    await expect(page.getByTestId("dashboard-greeting")).toHaveText("Willkommen, Amina Beispiel");
  });

  test("completion summary is careful and lists the separate legal documents", async ({ page }) => {
    await ready(page, "/dashboard/vorsorge/abschluss");
    await expect(page.getByTestId("completion-header")).toContainText("Deine Zusammenfassung");
    await expect(page.getByTestId("completion-header")).not.toContainText("geordnet");
    await expect(page.getByTestId("completion-legal")).toContainText("kein Testament, keine Vollmacht");
    await expect(page.getByTestId("completion-open")).toContainText("Noch nicht begonnen");
  });
});

test.describe("P1: Notfallpaket", () => {
  test("sensitive content only after its own confirmation; print shows only the package", async ({ page }) => {
    await ready(page, "/dashboard/vorsorge?schritt=aerzte");
    await page.getByLabel("Allergien").fill("Penicillin (Beispiel)");
    await ready(page, "/dashboard/notfallpaket");
    const doc = page.getByTestId("package-selection").locator("..").getByTestId("package-document");
    await expect(page.getByTestId("package-item-gesundheit")).not.toBeChecked();
    await expect(page.getByTestId("package-item-schulden")).not.toBeChecked();
    await expect(doc).not.toContainText("Penicillin");

    await page.getByTestId("package-item-gesundheit").click();
    await expect(page.getByTestId("package-confirm")).toBeVisible();
    await expect(doc).not.toContainText("Penicillin");
    await page.getByTestId("package-confirm-no").click();
    await expect(page.getByTestId("package-item-gesundheit")).not.toBeChecked();

    await page.getByTestId("package-item-gesundheit").click();
    await page.getByTestId("package-confirm-yes").click();
    await expect(doc).toContainText("Penicillin");
    await expect(doc).toContainText("Erstellt am");
    await expect(doc).toContainText("Kein Testament, keine Vollmacht");

    await page.emulateMedia({ media: "print" });
    await expect(page.getByTestId("package-selection")).toBeHidden();
    await expect(page.locator(".print-only").getByTestId("package-document")).toBeVisible();
    await expect(page.locator(".print-only").getByTestId("package-part-todesfall")).toBeVisible();
  });
});

test.describe("P1: mobile navigation", () => {
  test.use({ viewport: { width: 375, height: 740 } });

  test("four main destinations at the bottom, no doubled area list in the header, nothing cut off", async ({ page }) => {
    await ready(page, "/dashboard");
    const bar = page.getByTestId("dashboard-tabbar");
    await expect(bar).toBeVisible();
    await expect(bar.getByRole("link")).toHaveText(["Übersicht", "Vorsorge", "Familie", "Notfallpaket"]);
    await expect(page.locator("#dashboard-desktop-nav")).toBeHidden();
    await page.getByTestId("site-mobile-nav-toggle").click();
    await expect(page.getByTestId("site-mobile-nav")).not.toContainText("Alle Vorsorgebereiche");
    for (const path of ["/dashboard", "/dashboard/vorsorge", "/dashboard/vorsorge/abschluss", "/dashboard/notfallpaket", "/dashboard/personen"]) {
      await ready(page, path);
      await noHorizontalOverflow(page);
    }
    await bar.getByRole("link", { name: "Familie" }).click();
    await expect(page).toHaveURL(/\/dashboard\/personen$/);
  });

  test("inputs are at least 16px so phones do not zoom in", async ({ page }) => {
    await ready(page, "/dashboard/vorsorge");
    const size = await page.getByLabel("Dein Name").evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    expect(size).toBeGreaterThanOrEqual(16);
  });
});

test.describe("P1: very small screens", () => {
  test.use({ viewport: { width: 320, height: 640 } });

  test("dashboard, flow and package fit 320 px", async ({ page }) => {
    for (const path of ["/dashboard", "/dashboard/vorsorge?schritt=vollmacht", "/dashboard/notfallpaket"]) {
      await ready(page, path);
      await noHorizontalOverflow(page);
    }
  });
});
