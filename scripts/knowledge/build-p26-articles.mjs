#!/usr/bin/env node
/**
 * P2.6: merges the editorial article drafts (one JSON per group) into
 * src/modules/islamic-knowledge/full-articles/p26-articles.json and checks every source independently
 * of the people or tools that wrote the drafts:
 *
 * - Qur'an: German text fetched again live from QuranEnc (Bubenheim & Elyas) and compared character
 *   by character. On a mismatch the source falls back to "stelle_gefunden" and is listed.
 * - Hadith: number looked up in the full mirror editions (fawazahmed0/hadith-api, cache passed as
 *   argument); the Arabic excerpt must be a literal part of the mirror's Arabic text for that number.
 *   No number: "nicht_geprueft". Excerpt not found: at most "stelle_gefunden".
 * - Levels above "inhalt_geprueft" are never accepted from a draft (they need a person).
 *
 * Read-only towards the internet, no account, no personal data.
 * Usage: node scripts/knowledge/build-p26-articles.mjs <groups dir> <hadith cache dir> [report.json]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const [groupsDir, cacheDir, reportPath] = process.argv.slice(2);
if (!groupsDir || !cacheDir) {
  console.error("usage: build-p26-articles.mjs <groups dir> <hadith cache dir> [report.json]");
  process.exit(2);
}
const OUT = new URL("../../src/modules/islamic-knowledge/full-articles/p26-articles.json", import.meta.url);
const AREA_ORDER = ["faraid", "tod-sterben", "janazah", "vorsorge", "islam-und-recht", "akhira"];
const MACHINE = ["nicht_geprueft", "stelle_gefunden", "wortlaut_abgeglichen", "inhalt_geprueft"];
const today = new Date().toISOString().slice(0, 10);

const articles = readdirSync(groupsDir)
  .filter((g) => existsSync(join(groupsDir, g, "articles.json")))
  .flatMap((g) => JSON.parse(readFileSync(join(groupsDir, g, "articles.json"), "utf8")));

const editions = {};
for (const name of ["ara-bukhari", "ara-muslim"]) {
  const raw = JSON.parse(readFileSync(join(cacheDir, `${name}.json`), "utf8"));
  const byNumber = new Map();
  for (const h of raw.hadiths) {
    for (const key of [String(h.hadithnumber), String(h.arabicnumber)]) {
      if (!byNumber.has(key)) byNumber.set(key, []);
      byNumber.get(key).push(h.text ?? "");
    }
  }
  editions[name] = byNumber;
}
const norm = (s) => String(s ?? "").replace(/[‏‎​]/g, "").replace(/\s+/g, " ").trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function quranLive(s, a) {
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(`https://quranenc.com/api/v1/translation/aya/german_bubenheim/${s}/${a}`);
      if (res.ok) return (await res.json())?.result?.translation ?? null;
    } catch {
      /* retry */
    }
    await sleep(800 * (i + 1));
  }
  return null;
}

/** Muslim numbers like "939a" map to the mirror's arabicnumber "939.01". */
function mirrorKeys(h) {
  const m = /^(\d+)([a-z]?)$/i.exec(String(h.number).trim());
  if (!m) return [String(h.number)];
  const [, num, letter] = m;
  if (h.collection === "muslim" && letter) return [`${num}.${String(letter.toLowerCase().charCodeAt(0) - 96).padStart(2, "0")}`, num];
  return [num];
}

/**
 * Categories are never mixed: a Qur'an paragraph cites Qur'an, a hadith paragraph hadith, a Tafsir
 * paragraph Tafsir (and the verse it explains), a law paragraph law. A reference to another kind of
 * source (e.g. "Ibn Kathir cites Muslim 918a, checked separately below") moves to seeAlso.
 */
const OWN = { quran: ["quran"], tafsir: ["tafsir", "quran"], hadith: ["hadith"], recht: ["law"] };
let movedToSeeAlso = 0;
for (const a of articles) {
  const typeOf = new Map(["quran", "tafsir", "hadith", "law"].flatMap((t) => (a.sources?.[t] ?? []).map((src) => [src.ref, t])));
  for (const sec of a.sections) {
    for (const p of sec.paragraphs) {
      const own = OWN[p.kind];
      if (!own || !p.refs?.length) continue;
      const foreign = p.refs.filter((r) => !own.includes(typeOf.get(r)));
      if (!foreign.length) continue;
      p.refs = p.refs.filter((r) => own.includes(typeOf.get(r)));
      p.seeAlso = [...(p.seeAlso ?? []), ...foreign];
      movedToSeeAlso += foreign.length;
    }
  }
}

const report = { checkedAt: new Date().toISOString(), quran: { total: 0, exact: 0, mismatches: [] }, hadith: { total: 0, numberFound: 0, arabicMatches: 0, problems: [] }, cappedLevels: [] };
const quranCache = new Map();

for (const a of articles) {
  for (const type of ["quran", "tafsir", "hadith", "law"]) {
    for (const s of a.sources?.[type] ?? []) {
      if (!MACHINE.includes(s.status?.level)) {
        report.cappedLevels.push(`${a.id} ${s.ref}: ${s.status?.level}`);
        s.status = { ...s.status, level: "inhalt_geprueft" };
      }
    }
  }
  for (const q of a.sources.quran) {
    report.quran.total += 1;
    const key = `${q.surah}:${q.ayah}`;
    if (!quranCache.has(key)) {
      quranCache.set(key, await quranLive(q.surah, q.ayah));
      await sleep(120);
    }
    const live = quranCache.get(key);
    if (live !== null && norm(live) === norm(q.germanVerbatim)) {
      report.quran.exact += 1;
      q.status.method = `${q.status.method} | Gegenprüfung ${today}: zeichengleich mit QuranEnc (live)`;
    } else {
      report.quran.mismatches.push(`${a.id} ${q.ref}`);
      q.status = { level: "stelle_gefunden", method: `Gegenprüfung ${today}: Wortlaut weicht von QuranEnc ab oder nicht abrufbar`, checkedAt: today, by: "Claude (automatisch)" };
    }
  }
  for (const h of a.sources.hadith) {
    report.hadith.total += 1;
    const ed = editions[`ara-${h.collection}`];
    const texts = ed ? mirrorKeys(h).flatMap((k) => ed.get(k) ?? []) : [];
    if (!texts.length) {
      report.hadith.problems.push(`${a.id} ${h.ref}: Nummer nicht im Spiegel`);
      h.status = { level: "nicht_geprueft", method: `Gegenprüfung ${today}: Nummer im Spiegel nicht gefunden`, checkedAt: today, by: "Claude (automatisch)" };
      continue;
    }
    report.hadith.numberFound += 1;
    const excerpt = norm(h.arabicExcerpt).slice(0, 120);
    if (excerpt && texts.some((t) => norm(t).includes(excerpt))) {
      report.hadith.arabicMatches += 1;
      h.status.method = `${h.status.method} | Gegenprüfung ${today}: Nummer und arabischer Auszug im Spiegel bestätigt`;
    } else {
      report.hadith.problems.push(`${a.id} ${h.ref}: arabischer Auszug nicht im Spiegeltext`);
      if (MACHINE.indexOf(h.status.level) > MACHINE.indexOf("stelle_gefunden")) {
        h.status = { ...h.status, level: "stelle_gefunden", method: `${h.status.method} | Gegenprüfung ${today}: arabischer Auszug nicht wörtlich im Spiegel, Stufe herabgesetzt` };
      }
    }
  }
}

articles.sort((x, y) => AREA_ORDER.indexOf(x.area) - AREA_ORDER.indexOf(y.area) || x.id.localeCompare(y.id));
const out = {
  _note: "P2.6 Redaktionsentwuerfe (Version 2). Nur intern (/wissen/redaktion/artikel, isInternalToolsEnabled). Status DRAFT, keine fachliche Pruefung erfasst. Nicht veroeffentlichen ohne dokumentierte Pruefung durch qualifizierte Gelehrte und, bei deutschem Recht, Juristen.",
  generatedAt: today,
  verification: { checkedAt: report.checkedAt, quran: { total: report.quran.total, exact: report.quran.exact }, hadith: { total: report.hadith.total, numberFound: report.hadith.numberFound, arabicMatches: report.hadith.arabicMatches } },
  articles: articles.map((a) => ({ ...a, status: "DRAFT", version: 2, reviews: [] })),
};
writeFileSync(OUT, JSON.stringify(out, null, 1));
console.log(JSON.stringify({ articles: articles.length, movedToSeeAlso, quran: { total: report.quran.total, exact: report.quran.exact, mismatches: report.quran.mismatches.length }, hadith: { total: report.hadith.total, numberFound: report.hadith.numberFound, arabicMatches: report.hadith.arabicMatches, problems: report.hadith.problems.length }, cappedLevels: report.cappedLevels.length }, null, 1));
if (reportPath) writeFileSync(reportPath, JSON.stringify(report, null, 1));
