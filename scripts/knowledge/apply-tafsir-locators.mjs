#!/usr/bin/env node
/**
 * P2.6: adds the printed location (volume and page) of Ibn Kathir's commentary to every Tafsir source
 * in p26-articles.json. The locations come from a lookup file built against the Shamela copy of
 * exactly the cited edition (Dār Ṭayba, ed. as-Salāma, 2nd ed. 1420/1999, 8 vols; shamela.ws/book/8473),
 * whose page titles carry the printed volume and page.
 *
 * Only entries marked `confirmed` are used; anything else keeps "Band/Seite: offen". The lookup is a
 * digital copy, so every location stays to be checked against a printed copy (named in manualChecks).
 * Idempotent: running it again replaces the earlier location.
 *
 * Usage: node scripts/knowledge/apply-tafsir-locators.mjs <locators.json>
 * locators.json: { "4:11": { volume, page, shamelaPage, url, group, confirmed }, ... }
 */
import { readFileSync, writeFileSync } from "node:fs";

const [lookupPath] = process.argv.slice(2);
if (!lookupPath) {
  console.error("usage: apply-tafsir-locators.mjs <locators.json>");
  process.exit(2);
}
const FILE = new URL("../../src/modules/islamic-knowledge/full-articles/p26-articles.json", import.meta.url);
const data = JSON.parse(readFileSync(FILE, "utf8"));
const lookup = JSON.parse(readFileSync(lookupPath, "utf8"));
const today = new Date().toISOString().slice(0, 10);
const NOTE = " | Fundstelle Band/Seite";

let set = 0;
let open = 0;
for (const a of data.articles) {
  for (const t of a.sources.tafsir) {
    const base = `Zu Sure ${t.surah}, Vers ${t.ayah}`;
    const hit = lookup[`${t.surah}:${t.ayah}`];
    t.status.method = t.status.method.split(NOTE)[0];
    if (hit?.confirmed && Number.isInteger(hit.volume) && Number.isInteger(hit.page)) {
      const group = hit.group ? ` (Abschnitt zu ${hit.group.replace("-", "–")})` : "";
      t.locator = `${base}; Dār Ṭayba Bd. ${hit.volume}, S. ${hit.page}${group} – nach dem Shamela-Digitalisat dieser Ausgabe, am Druckexemplar zu bestätigen`;
      t.printLocator = { volume: hit.volume, page: hit.page, group: hit.group ?? null, digitalCopy: hit.url, source: "shamela.ws/book/8473", lookedUpAt: today };
      t.status.method += `${NOTE} am ${today} im Shamela-Digitalisat derselben Ausgabe ermittelt (Seitentitel und Versanfang abgeglichen)`;
      set += 1;
    } else {
      t.locator = `${base}; Band/Seite: offen (am Druckexemplar zu ergänzen)`;
      delete t.printLocator;
      open += 1;
    }
  }
}
writeFileSync(FILE, JSON.stringify(data, null, 1));
console.log(JSON.stringify({ set, open }));
