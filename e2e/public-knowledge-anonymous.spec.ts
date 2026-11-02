/**
 * What a visitor without an account can reach. Unreviewed religious and legal statements stay out
 * of pages, APIs, search, sitemap, direct URLs and browser code. Runs in every build.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

/** Distinctive sentences from drafts, legacy articles and source data. */
const UNREVIEWED = [
  "enden seine Taten außer drei",
  "in drei weiße Tücher gehüllt",
  "bei der Waschung seiner",
  "Ein Drittel, und ein Drittel ist viel",
  "drei Dinar Schulden",
  "Beschleunigt die Janazah",
  "rituelle Reinigung des Verstorbenen",
  "Muslimische Patienten haben oft spezielle Wünsche",
  "beständige Wohltätigkeit",
];
const PUBLIC_PAGES = ["/", "/wissen", "/check", "/preise", "/akuter-todesfall", "/patientenverfuegung", "/janazah-kompass", "/barzakh", "/sadaqa-jariya", "/testament-erbe", "/islam-oder-kultur", "/konvertierte", "/sicherheit", "/partner", "/bestatter"];
const DRAFT_URLS = ["/wissen/janazah-wuensche", "/wissen/ghusl-kafan", "/wissen/islam/was-ist-janazah", "/wissen/islam/ghusl-des-verstorbenen", "/wissen/islam/kafan-und-janazah-gebet", "/wissen/islam/sadaqa-jariya-und-vermaechtnisse", "/wissen/redaktion"];

const hitsIn = (text: string) => UNREVIEWED.filter((phrase) => text.includes(phrase));

test.describe("visitor without an account", () => {
  test("no page shows unreviewed statements or calls anything reviewed", async ({ page }) => {
    for (const path of PUBLIC_PAGES) {
      await page.goto(path);
      for (const toggle of await page.locator('button[aria-expanded="false"]').all()) await toggle.click({ timeout: 500 }).catch(() => undefined);
      const text = await page.locator("body").innerText();
      expect(hitsIn(text), path).toEqual([]);
      expect(text, path).not.toMatch(/Fachlich geprüft|Geprüfte Wissensbasis|\bGeprüft\b/);
      expect(await page.content(), path).not.toContain("Sahih Muslim, Hadith");
    }
  });

  test("direct links to drafts and the editorial preview return 404", async ({ request }) => {
    for (const path of DRAFT_URLS) expect((await request.get(path)).status(), path).toBe(404);
  });

  test("APIs and search deliver organisational help only", async ({ request }) => {
    const list = await request.get("/api/knowledge/entries");
    expect(list.status()).toBe(200);
    const body = await list.text();
    expect(hitsIn(body)).toEqual([]);
    expect(body).not.toContain("Geprüfte");
    expect((JSON.parse(body) as { count: number }).count).toBe(5);

    for (const id of ["kb-ghusl-kafan", "kb-janazah-begriffe", "kb-sadaqa-jariya", "kb-vorsorgevollmacht-allgemein", "kb-patientenverfuegung-allgemein"]) {
      expect((await request.get(`/api/knowledge/entries/${id}`)).status(), id).toBe(404);
    }
    for (const q of ["ghusl", "kafan", "janazah", "sadaqa", "patientenverfügung", "barzakh"]) {
      const res = await (await request.get(`/api/knowledge/search?q=${encodeURIComponent(q)}`)).text();
      expect(hitsIn(res), q).toEqual([]);
      expect(res, q).not.toMatch(/kb-(ghusl|janazah|sadaqa|patientenv|vorsorgev|bestattung)/);
    }
    expect((await (await request.get("/api/knowledge/published-links")).json()).articles).toEqual([]);
  });

  test("the sitemap lists no drafts", async ({ request }) => {
    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).not.toContain("/wissen/islam/");
    expect(sitemap).not.toMatch(/\/wissen\/[a-z]/);
  });

  test("the search on the knowledge page names topics, no content", async ({ page }) => {
    await page.goto("/wissen");
    await page.getByPlaceholder("Worüber möchtest du mehr wissen?").fill("Ghusl");
    await page.waitForTimeout(300);
    expect(hitsIn(await page.locator("body").innerText())).toEqual([]);
  });

  test("browser code that anyone can download holds no unreviewed text", async () => {
    const dir = process.env.AMANAH_E2E_DIST_DIR ?? ".next";
    const walk = (path: string): string[] =>
      statSync(path).isDirectory() ? readdirSync(path).flatMap((name) => walk(join(path, name))) : [path];
    const files = walk(join(dir, "static")).filter((file) => file.endsWith(".js"));
    expect(files.length).toBeGreaterThan(5);
    for (const file of files) {
      const code = readFileSync(file, "utf8");
      expect(hitsIn(code), file).toEqual([]);
    }
  });
});
