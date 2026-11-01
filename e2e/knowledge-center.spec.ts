import { test, expect, type Page } from "@playwright/test";

const FORMER_TOPIC_PAGES = ["/janazah-kompass", "/barzakh", "/testament-erbe", "/islam-oder-kultur", "/sadaqa-jariya"];

/** Sentences from unreviewed legacy content that must not be public any more. */
const UNREVIEWED_PHRASES = ["Zustimmung aller Erben", "Söhne erhalten doppelt so viel", "gesammelt", "Nur Allah entscheidet"];

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

test.describe("Islamic knowledge centre", () => {
  test("search understands spelling variants and names planned topics without content or links", async ({ page }) => {
    await page.goto("/wissen");
    await page.getByRole("searchbox", { name: "Wissen durchsuchen" }).fill("Was ist Gusl?");
    const prepared = page.getByTestId("knowledge-search-prepared");
    await expect(prepared).toContainText("Ghusl des Verstorbenen");
    await expect(prepared.locator("a")).toHaveCount(0);
    await expect(page.getByTestId("knowledge-search-empty")).toContainText("noch keinen veröffentlichten Artikel");
    await expect(page.locator('a[href^="/wissen/islam/"]')).toHaveCount(0);
    await page.getByRole("searchbox", { name: "Wissen durchsuchen" }).fill("qqqxyz");
    await expect(page.getByTestId("knowledge-search-empty")).toContainText("Kein Thema gefunden");
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("search names its result, offers suggestions and clears with Escape", async ({ page }) => {
    await page.goto("/wissen?q=Gusl");
    const box = page.getByRole("searchbox", { name: "Wissen durchsuchen" });
    await expect(page.getByRole("search")).toBeVisible();
    await expect(page.getByTestId("knowledge-search-count")).toContainText("0 Ergebnisse für „Gusl“");
    await expect(page.getByTestId("knowledge-search-count")).toContainText("in Vorbereitung");
    await expect(page.getByTestId("knowledge-search-suggestions")).toHaveCount(0);
    await box.fill("qqqxyz");
    await page.getByTestId("knowledge-search-suggestions").getByRole("button", { name: "Kafan" }).click();
    await expect(box).toHaveValue("Kafan");
    await expect(page.getByTestId("knowledge-search-prepared")).toBeVisible();
    await expect(page.locator('a[href^="/wissen/islam/"]')).toHaveCount(0);
    await box.press("Escape");
    await expect(box).toHaveValue("");
    await expect(page.getByTestId("knowledge-search-count")).toHaveCount(0);
  });

  test("a search can be linked, survives a reload and can be cleared", async ({ page }) => {
    await page.goto("/wissen?q=Gusl");
    const box = page.getByRole("searchbox", { name: "Wissen durchsuchen" });
    await expect(box).toHaveValue("Gusl");
    await expect(page.getByTestId("knowledge-search-prepared")).toContainText("Ghusl des Verstorbenen");
    await box.fill("Kafan");
    await expect(page).toHaveURL(/\?q=Kafan$/);
    await page.reload();
    await expect(page.getByRole("searchbox", { name: "Wissen durchsuchen" })).toHaveValue("Kafan");
    await page.getByTestId("knowledge-search-clear").click();
    await expect(page).toHaveURL(/\/wissen$/);
    await expect(page.getByTestId("knowledge-search-count")).toHaveCount(0);
    await expect(page.locator('a[href^="/wissen/islam/"]')).toHaveCount(0);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  test("hub shows areas A–E and no unreviewed articles", async ({ page }) => {
    await page.goto("/wissen");
    await expect(page.getByRole("heading", { level: 1, name: "Islamisches Wissen" })).toBeVisible();
    const areas = page.getByTestId("knowledge-areas").locator("section");
    await expect(areas).toHaveCount(5);
    await expect(page.getByText(/Themen in Vorbereitung/).first()).toBeVisible();
    await expect(page.locator('a[href^="/wissen/islam/"]')).toHaveCount(0);
    expect(await hasHorizontalOverflow(page)).toBe(false);
  });

  for (const path of FORMER_TOPIC_PAGES) {
    test(`former topic page ${path} shows only gated content`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("link", { name: "Zum Wissenszentrum" })).toBeVisible();
      const text = await page.locator("main, body").first().innerText();
      for (const phrase of UNREVIEWED_PHRASES) expect(text).not.toContain(phrase);
      expect(await hasHorizontalOverflow(page)).toBe(false);
    });
  }

  test("unpublished article URLs and the editorial preview return 404", async ({ page }) => {
    for (const path of [
      "/wissen/islam/fara-id",
      "/wissen/islam/wasiyyah",
      "/wissen/islam/islamisches-erbrecht-grundlagen",
      "/wissen/redaktion",
      "/wissen/redaktion/paket/ik-start-01-faraid-grundlagen",
      "/intern/pruefworkflow",
      "/intern/vorsorge-plus",
    ]) {
      const res = await page.goto(path);
      expect(res?.status(), path).toBe(404);
    }
  });

  test("homepage has no links to unpublished knowledge pages", async ({ page }) => {
    await page.goto("/");
    const hrefs = await page.locator('a[href^="/wissen/"]').evaluateAll((els) => els.map((e) => e.getAttribute("href")));
    expect(hrefs).toEqual([]);
  });

  test("main navigation names the knowledge centre", async ({ page, isMobile }) => {
    await page.goto("/");
    if (isMobile) await page.getByRole("button", { name: "Menü" }).click();
    await expect(page.getByRole("link", { name: "Islamisches Wissen" }).first()).toBeVisible();
  });
});

test.describe("SEO", () => {
  test("sitemap contains no draft articles; robots blocks private areas", async ({ request }) => {
    const sitemapXml = await (await request.get("/sitemap.xml")).text();
    expect(sitemapXml).toContain("/wissen");
    expect(sitemapXml).not.toContain("/wissen/islam/");
    const robotsTxt = await (await request.get("/robots.txt")).text();
    expect(robotsTxt).toContain("Disallow: /dashboard");
    expect(robotsTxt).toContain("Disallow: /wissen/redaktion");
  });
});

test.describe("Testament preparation lock", () => {
  test("questionnaire stays locked in standard builds", async ({ page }) => {
    await page.goto("/dashboard/testament/vorbereitung");
    await expect(page.getByTestId("testament-preparation-locked")).toBeVisible();
    await expect(page.getByTestId("preparation-summary")).toHaveCount(0);
  });

  test("stored answers do not open the locked area", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem(
        "amanah-ordner-data",
        JSON.stringify({
          state: {
            assets: [{ id: "a1", type: "bank", description: "Girokonto" }],
            testamentPreparation: {
              currentStep: 999,
              personalWishes: { bequests: [{ id: "b1", kind: "percent", value: 50, beneficiary: "Moschee", beneficiaryKind: "organisation", alsoHeir: "" }] },
            },
          },
          version: 0,
        }),
      );
    });
    await page.goto("/dashboard/testament/vorbereitung");
    await expect(page.getByTestId("testament-preparation-locked")).toBeVisible();
    for (const id of ["preparation-summary", "preparation-assets", "bequest-editor", "bequest-summary", "faraid-model-result", "preparation-progress"]) {
      await expect(page.getByTestId(id)).toHaveCount(0);
    }
    await expect(page.getByText("Moschee")).toHaveCount(0);
  });
});

test.describe("Testament hints", () => {
  test("the module shows neutral questions and no verdict", async ({ page }) => {
    await page.goto("/dashboard/testament");
    await expect(page.getByTestId("inheritance-conversation-points")).toContainText("Fragen für dein Gespräch");
    await expect(page.getByText(/Erste Hinweise:/)).toHaveCount(0);
    await expect(page.getByText("Keine Auffälligkeiten erkannt")).toHaveCount(0);
    await expect(page.getByText("Möglicher Konflikt mit festen Erbanteilen")).toHaveCount(0);
    await expect(page.getByLabel(/Notizen zur Waṣiyya/)).toBeVisible();
    await expect(page.getByText("(max. 1/3)")).toHaveCount(0);
  });

  test("the printed overview cannot pass for a legal document", async ({ page }) => {
    await page.goto("/dashboard/pdf");
    await page.emulateMedia({ media: "print" });
    const view = page.getByTestId("full-print-view");
    await expect(view).toBeVisible();
    await expect(view.getByRole("heading", { level: 1 })).toHaveText("Vorsorge-Übersicht");
    await expect(page.getByTestId("full-print-page-notice")).toContainText("kein Testament, keine Vollmacht, keine Patientenverfügung");
    await expect(view).not.toContainText("Mein Wille — Komplett");
    await expect(view).toContainText("keine Patientenverfügung");
  });
});
