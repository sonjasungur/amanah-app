import { test, expect, type Page } from "@playwright/test";

const FORMER_TOPIC_PAGES = ["/janazah-kompass", "/barzakh", "/testament-erbe", "/islam-oder-kultur", "/sadaqa-jariya"];

/** Sentences from unreviewed legacy content that must not be public any more. */
const UNREVIEWED_PHRASES = ["Zustimmung aller Erben", "Söhne erhalten doppelt so viel", "gesammelt", "Nur Allah entscheidet"];

async function hasHorizontalOverflow(page: Page): Promise<boolean> {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
}

test.describe("Islamic knowledge centre", () => {
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
});

test.describe("Testament hints", () => {
  test("module shows neutral hints, never an approval", async ({ page }) => {
    await page.goto("/dashboard/testament");
    await expect(page.getByText(/Erste Hinweise:/)).toBeVisible();
    await expect(page.getByText(/Automatische Stichwort-Hinweise, keine Prüfung/)).toBeVisible();
    await expect(page.getByText("Grundsätzlich in Ordnung")).toHaveCount(0);
  });
});
