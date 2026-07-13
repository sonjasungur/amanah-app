#!/usr/bin/env node
/**
 * Local smoke checks against running dev server (PORT 3002).
 * Does not replace manual browser QA.
 */
const BASE = process.env.ACCEPTANCE_BASE || "http://localhost:3002";

const routes = [
  "/",
  "/check",
  "/wissen",
  "/wissen/janazah-wuensche",
  "/wissen/ghusl-kafan",
  "/wissen/bestattung-ueberfuehrung",
  "/wissen/patientenverfuegung",
  "/wissen/vorsorgevollmacht",
  "/wissen/betreuungsverfuegung",
  "/wissen/testament-erbe",
  "/wissen/schulden-amanah",
  "/wissen/digitaler-nachlass",
  "/wissen/sadaqa-jariya",
  "/wissen/familiengespraech",
  "/wissen/notfallkarte",
  "/dashboard",
  "/dashboard/familiengespraech",
  "/dashboard/familie",
  "/dashboard/ausfuellen",
  "/preise",
  "/konvertierte",
];

async function main() {
  const results = [];
  for (const path of routes) {
    try {
      const res = await fetch(`${BASE}${path}`);
      const html = await res.text();
      results.push({
        path,
        status: res.status,
        ok: res.ok,
        hasError: /Application error|Internal Server Error/i.test(html),
        snippet: html.slice(0, 200),
      });
    } catch (e) {
      results.push({ path, ok: false, error: String(e) });
    }
  }

  const home = results.find((r) => r.path === "/");
  const checks = {
    brandName: false,
    heroHeadline: false,
    heroCta: false,
    checkPage: false,
    preiseFree: false,
  };

  if (home?.ok) {
    const full = await (await fetch(`${BASE}/`)).text();
    checks.brandName = full.includes("Mein Wille");
    checks.heroHeadline = full.includes("Damit meine Familie weiß, was mir wichtig ist");
    checks.heroCta = full.includes("Kostenlos prüfen, was noch fehlt") && full.includes('href="/check"');
  }

  const checkHtml = results.find((r) => r.path === "/check");
  if (checkHtml?.ok) {
    const full = await (await fetch(`${BASE}/check`)).text();
    checks.checkPage = full.includes("Amanah-Check");
  }

  const preiseHtml = results.find((r) => r.path === "/preise");
  if (preiseHtml?.ok) {
    const full = await (await fetch(`${BASE}/preise`)).text();
    checks.preiseFree = full.includes("Amanah-Check") && full.includes("0 €");
  }

  const failed = results.filter((r) => !r.ok || r.hasError);
  console.log(JSON.stringify({ base: BASE, checks, failed, passed: results.length - failed.length, total: results.length }, null, 2));
  process.exit(failed.length > 0 ? 1 : 0);
}

main();
