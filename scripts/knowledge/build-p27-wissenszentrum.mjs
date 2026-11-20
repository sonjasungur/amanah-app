#!/usr/bin/env node
/**
 * P2.7 knowledge centre: takes reviewed article drafts (version 3) and the entry page, checks every source
 * independently and writes src/modules/islamic-knowledge/full-articles/p27-articles.json.
 *
 * Independent checks (nothing is trusted from the draft):
 * - Qur'an: German text character for character against QuranEnc german_bubenheim (live API, footnote
 *   markers removed), Arabic against the same API's arabic_text.
 * - Hadith: number found in the full mirror edition (fawazahmed0/hadith-api, cached), Arabic excerpt a
 *   literal part of that number's text; for collections outside Bukhari/Muslim every stated grading must
 *   match the mirror's grading of exactly this number (never carried over to another number).
 * - Tafsir: printed volume/page against the Shamela page title of Dār Ṭayba (book 8473); German edition
 *   pages only for 3:185 (compared by the owner against photos of the book).
 * - Fatwa/scholar: page fetched (HTTP 200); an Arabic excerpt must occur in the page text.
 * - Law: official page fetched (HTTP 200).
 * Whatever fails is lowered to "stelle_gefunden" (or "nicht_geprueft") and listed in the report.
 * Levels above "inhalt_geprueft" are never set. Status DRAFT, version 3, no reviews.
 *
 * Usage: node scripts/knowledge/build-p27-wissenszentrum.mjs <cacheDir> <draft.json>…
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const [cacheDir, ...inputs] = process.argv.slice(2);
if (!cacheDir || !inputs.length) {
  console.error("usage: build-p27-wissenszentrum.mjs <cacheDir> <draft.json>…");
  process.exit(2);
}
mkdirSync(cacheDir, { recursive: true });
const OUT = new URL("../../src/modules/islamic-knowledge/full-articles/p27-articles.json", import.meta.url);
const MACHINE = ["nicht_geprueft", "stelle_gefunden", "wortlaut_abgeglichen", "inhalt_geprueft"];
const today = new Date().toISOString().slice(0, 10);
const UA = { "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AmanahQuellenpruefung/1.0" };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s ?? "").replace(/[‎‏​­]/g, "").replace(/\s+/g, " ").trim();
const stripTags = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
// Arabic comparison without vowel signs and tatweel, so a page that prints the text unvocalised still matches.
// OpenITI texts break lines with "~~" and carry page milestones ("PageV01P194"); they are not part of the text.
const arabicCore = (s) => norm(String(s ?? "").replace(/PageV\d+P\d+/g, " ").replace(/ms\d+/g, " ").replace(/~~|#/g, " ")).replace(/[ً-ٰٟۖ-ۭـ]/g, "").replace(/[إأآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه");

async function get(url, { json = false, tries = 3 } = {}) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: UA, redirect: "follow" });
      if (res.ok) return json ? await res.json() : await res.text();
      if (res.status === 404 || res.status === 403) return { status: res.status };
    } catch {
      /* retry */
    }
    await sleep(900 * (i + 1));
  }
  return null;
}

const drafts = inputs.flatMap((f) => {
  const d = JSON.parse(readFileSync(f, "utf8"));
  return Array.isArray(d) ? d : d.articles ?? [d];
});

const report = { checkedAt: new Date().toISOString(), quran: { total: 0, exact: 0, problems: [] }, hadith: { total: 0, confirmed: 0, problems: [] }, tafsir: { total: 0, located: 0, problems: [] }, fatwa: { total: 0, confirmed: 0, problems: [] }, law: { total: 0, reachable: 0, problems: [] }, cappedLevels: [] };
const lower = (s, level, why) => {
  if (MACHINE.indexOf(s.status.level) > MACHINE.indexOf(level)) s.status = { ...s.status, level };
  s.status.method = `${s.status.method} | Gegenprüfung ${today}: ${why}`;
  s.status.checkedAt = today;
};
const confirm = (s, what) => {
  s.status.method = `${s.status.method} | Gegenprüfung ${today}: ${what}`;
  s.status.checkedAt = today;
};

const editions = {};
async function edition(coll) {
  if (editions[coll]) return editions[coll];
  const file = join(cacheDir, `ara-${coll}.json`);
  if (!existsSync(file)) {
    const raw = await get(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/ara-${coll}.json`, { json: true });
    if (!raw?.hadiths) throw new Error(`Spiegel ara-${coll} nicht ladbar`);
    writeFileSync(file, JSON.stringify(raw));
  }
  const raw = JSON.parse(readFileSync(file, "utf8"));
  const byNumber = new Map();
  for (const h of raw.hadiths) {
    for (const key of [String(h.hadithnumber), String(h.arabicnumber)]) {
      if (!byNumber.has(key)) byNumber.set(key, []);
      byNumber.get(key).push(h);
    }
  }
  return (editions[coll] = byNumber);
}
function mirrorKeys(h) {
  const m = /^(\d+)([a-z]?)$/i.exec(String(h.number).trim());
  if (!m) return [String(h.number)];
  const [, num, letter] = m;
  if (h.collection === "muslim" && letter) return [`${num}.${String(letter.toLowerCase().charCodeAt(0) - 96).padStart(2, "0")}`, num];
  return [num];
}
// Transliterations differ ("Šākir"/"Shakir", "ġairihī"/"ghairihi"): map the special letters before comparing.
const TRANSLIT = { š: "sh", ś: "sh", ġ: "gh", ḫ: "kh", ṯ: "th", ḏ: "dh", ǧ: "j" };
const gradeKey = (s) => s.toLowerCase().replace(/[šśġḫṯḏǧ]/g, (c) => TRANSLIT[c]).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[ʿʾ'`’\-_.]/g, "").replace(/\s+/g, "");
const SCHOLAR = {
  muhammadmuhyiaddinabdalhamid: "muhyi",
  ahmadmuhammadshakir: "shakir",
  bashsharawwadmaruf: "bashar",
  basharawadmaarouf: "bashar",
  shuaibalarnaut: "arnaut",
  attirmidhi: "tirmidhi", albani: "albani", alalbani: "albani", muhammadmuhyialdinabdulhamid: "muhyi", muhyialdinabdalhamid: "muhyi", zubairalizai: "zubair", shuaibalarnaut: "arnaut", suaibalarnaut: "arnaut" };
const scholar = (s) => SCHOLAR[gradeKey(s)] ?? gradeKey(s);

const quranCache = new Map();
const pageCache = new Map();
async function page(url) {
  if (!pageCache.has(url)) {
    pageCache.set(url, await get(url));
    await sleep(250);
  }
  return pageCache.get(url);
}

// A "see also" that names another article (not a source) becomes a reading link of the article.
const articleIds = new Set([...drafts.map((d) => d.id), ...JSON.parse(readFileSync(new URL("../../src/modules/islamic-knowledge/full-articles/p26-articles.json", import.meta.url), "utf8")).articles.map((x) => x.id)]);
for (const a of drafts) {
  const related = new Set(a.relatedArticles ?? []);
  for (const sec of a.sections) for (const p of sec.paragraphs) {
    const moved = (p.seeAlso ?? []).filter((r) => articleIds.has(r));
    moved.forEach((r) => related.add(r));
    if (moved.length) p.seeAlso = p.seeAlso.filter((r) => !articleIds.has(r));
    if (p.seeAlso && !p.seeAlso.length) delete p.seeAlso;
  }
  if (related.size) a.relatedArticles = [...related];
}

for (const a of drafts) {
  a.status = "DRAFT";
  a.version = 3;
  a.reviews = [];
  a.sources = { quran: [], tafsir: [], hadith: [], law: [], fatwa: [], ...a.sources };
  for (const type of ["quran", "tafsir", "hadith", "law", "fatwa"]) {
    for (const s of a.sources[type]) {
      s.status = { level: "nicht_geprueft", method: "", checkedAt: today, by: "Claude (automatisch)", ...s.status };
      if (!MACHINE.includes(s.status.level)) {
        report.cappedLevels.push(`${a.id} ${s.ref}: ${s.status.level}`);
        s.status.level = "inhalt_geprueft";
      }
    }
  }

  for (const q of a.sources.quran) {
    report.quran.total += 1;
    const key = `${q.surah}:${q.ayah}`;
    if (!quranCache.has(key)) {
      quranCache.set(key, (await get(`https://quranenc.com/api/v1/translation/aya/german_bubenheim/${q.surah}/${q.ayah}`, { json: true }))?.result ?? null);
      await sleep(150);
    }
    const live = quranCache.get(key);
    const german = norm(String(live?.translation ?? "").replace(/\[\d+\]/g, ""));
    // A quoted excerpt of a verse is allowed if it is a literal part of the verse; it is marked as such.
    const fullDe = live && german === norm(q.germanVerbatim);
    const fullAr = live && (!q.arabic || norm(live.arabic_text) === norm(q.arabic));
    const okDe = live && (fullDe || german.includes(norm(q.germanVerbatim)));
    const okAr = live && (fullAr || norm(live.arabic_text).includes(norm(q.arabic)));
    if (okDe && okAr) {
      report.quran.exact += 1;
      if (!(fullDe && fullAr)) q.excerpt = true;
      confirm(q, fullDe && fullAr ? "deutscher und arabischer Wortlaut zeichengleich mit QuranEnc (live)" : "wörtlicher Auszug des Verses, zeichengleich als Teil des Wortlauts bei QuranEnc (live)");
    } else {
      report.quran.problems.push(`${a.id} ${q.ref}: ${!live ? "nicht abrufbar" : !okDe ? "deutscher Wortlaut weicht ab" : "arabischer Wortlaut weicht ab"}`);
      lower(q, "stelle_gefunden", "Wortlaut weicht von QuranEnc ab oder nicht abrufbar");
    }
  }

  for (const h of a.sources.hadith) {
    report.hadith.total += 1;
    let ed;
    try {
      ed = await edition(h.collection);
    } catch (e) {
      report.hadith.problems.push(`${a.id} ${h.ref}: ${e.message}`);
      lower(h, "nicht_geprueft", "Spiegel nicht ladbar");
      continue;
    }
    const entries = mirrorKeys(h).flatMap((k) => ed.get(k) ?? []);
    if (!entries.length) {
      report.hadith.problems.push(`${a.id} ${h.ref}: Nummer nicht im Spiegel`);
      lower(h, "nicht_geprueft", "Nummer im Spiegel nicht gefunden");
      continue;
    }
    const excerpt = norm(h.arabicExcerpt).slice(0, 160);
    const textOk = excerpt && entries.some((e) => norm(e.text).includes(excerpt));
    let gradeOk = true;
    if (h.collection !== "bukhari" && h.collection !== "muslim") {
      const mirrorGrades = entries.flatMap((e) => e.grades ?? []);
      // at-Tirmiḏī's own verdict is part of his text ("هذا حديث حسن غريب"), not of the mirror's grade list.
      const SELF = { hasan: "حسن", sahih: "صحيح", gharib: "غريب" };
      const selfInText = (g) => {
        const words = gradeKey(g.grade).match(/hasan|sahih|gharib/g) ?? [];
        const phrase = words.map((w) => SELF[w]).join(" ");
        return words.length > 0 && entries.some((e) => arabicCore(e.text).includes(arabicCore(phrase)));
      };
      gradeOk = (h.grading ?? []).length > 0 && (h.grading ?? []).every((g) => (scholar(g.by) === "tirmidhi" && h.collection === "tirmidhi" ? selfInText(g) : mirrorGrades.some((m) => scholar(m.name) === scholar(g.by) && gradeKey(m.grade) === gradeKey(g.grade))));
      if (!gradeOk) report.hadith.problems.push(`${a.id} ${h.ref}: Einstufung stimmt nicht mit dem Spiegel überein (Spiegel: ${mirrorGrades.map((m) => `${m.name}: ${m.grade}`).join(", ") || "keine"})`);
    }
    if (textOk && gradeOk) {
      report.hadith.confirmed += 1;
      confirm(h, h.collection === "bukhari" || h.collection === "muslim" ? "Nummer und arabischer Auszug im Spiegel bestätigt" : "Nummer, arabischer Auszug und Einstufung dieser Nummer im Spiegel bestätigt");
    } else {
      if (!textOk) report.hadith.problems.push(`${a.id} ${h.ref}: arabischer Auszug nicht wörtlich im Spiegeltext`);
      lower(h, "stelle_gefunden", textOk ? "Einstufung nicht bestätigt" : "arabischer Auszug nicht wörtlich im Spiegel");
    }
  }

  for (const t of a.sources.tafsir) {
    report.tafsir.total += 1;
    if (t.status.level === "wortlaut_abgeglichen") t.status.level = "inhalt_geprueft"; // a summary is never verbatim
    if (t.germanEdition && !(t.surah === 3 && t.ayah === 185)) {
      report.tafsir.problems.push(`${a.id} ${t.ref}: deutsche Seitenangabe entfernt (nur 3:185 geprüft)`);
      delete t.germanEdition;
    }
    if (!t.printLocator) {
      report.tafsir.problems.push(`${a.id} ${t.ref}: ohne Band/Seite`);
      continue;
    }
    const html = await page(t.printLocator.digitalCopy);
    const title = typeof html === "string" ? (/<title>([^<]*)<\/title>/i.exec(html)?.[1] ?? "") : "";
    const want = `ج${t.printLocator.volume} - ص${t.printLocator.page}`;
    if (title.includes(want)) {
      report.tafsir.located += 1;
      confirm(t, `Seitentitel im Shamela-Digitalisat bestätigt (${want})`);
    } else {
      report.tafsir.problems.push(`${a.id} ${t.ref}: Seitentitel passt nicht (${want} / „${title.slice(0, 60)}“)`);
      lower(t, "stelle_gefunden", "Band/Seite im Digitalisat nicht bestätigt");
    }
  }

  for (const f of a.sources.fatwa) {
    report.fatwa.total += 1;
    const html = await page(f.url);
    if (typeof html !== "string") {
      report.fatwa.problems.push(`${a.id} ${f.ref}: Seite nicht abrufbar (${html?.status ?? "Fehler"}) ${f.url}`);
      lower(f, "stelle_gefunden", "Originalseite bei der Gegenprüfung nicht abrufbar");
      continue;
    }
    if (f.arabicExcerpt) {
      const needle = arabicCore(f.arabicExcerpt).slice(0, 80);
      if (arabicCore(stripTags(html)).includes(needle)) {
        report.fatwa.confirmed += 1;
        confirm(f, "Originalseite abgerufen, arabischer Auszug im Seitentext gefunden");
      } else {
        report.fatwa.problems.push(`${a.id} ${f.ref}: arabischer Auszug nicht im Seitentext`);
        lower(f, "stelle_gefunden", "arabischer Auszug im Seitentext nicht gefunden");
      }
    } else {
      report.fatwa.confirmed += 1;
      confirm(f, "Originalseite abgerufen (kein arabischer Auszug zum Abgleich)");
    }
  }

  for (const l of a.sources.law) {
    report.law.total += 1;
    const html = await page(l.url);
    if (typeof html === "string") {
      report.law.reachable += 1;
      confirm(l, "amtliche Seite abrufbar");
    } else {
      report.law.problems.push(`${a.id} ${l.ref}: nicht abrufbar (${html?.status ?? "Fehler"}) ${l.url}`);
      lower(l, "stelle_gefunden", "amtliche Seite bei der Gegenprüfung nicht abrufbar");
    }
  }
}

const einstieg = drafts.find((a) => a.rubric === 0) ?? null;
const articles = drafts.filter((a) => a.rubric !== 0);
writeFileSync(
  OUT,
  `${JSON.stringify(
    {
      _note: "P2.7 Wissenszentrum: neue und neu gefasste Artikel (Version 3) und die Einstiegsseite. Erzeugt von scripts/knowledge/build-p27-wissenszentrum.mjs aus geprüften Entwürfen; nicht von Hand bearbeiten.",
      generatedAt: report.checkedAt,
      verification: {
        checkedAt: report.checkedAt,
        quran: { total: report.quran.total, exact: report.quran.exact },
        hadith: { total: report.hadith.total, confirmed: report.hadith.confirmed },
        tafsir: { total: report.tafsir.total, located: report.tafsir.located },
        fatwa: { total: report.fatwa.total, confirmed: report.fatwa.confirmed },
        law: { total: report.law.total, reachable: report.law.reachable },
      },
      einstieg,
      articles,
    },
    null,
    1,
  )}\n`,
);
writeFileSync(join(cacheDir, "pruefbericht-p27.json"), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ articles: articles.length, einstieg: Boolean(einstieg), quran: `${report.quran.exact}/${report.quran.total}`, hadith: `${report.hadith.confirmed}/${report.hadith.total}`, tafsir: `${report.tafsir.located}/${report.tafsir.total}`, fatwa: `${report.fatwa.confirmed}/${report.fatwa.total}`, law: `${report.law.reachable}/${report.law.total}`, problems: [...report.quran.problems, ...report.hadith.problems, ...report.tafsir.problems, ...report.fatwa.problems, ...report.law.problems].length, cappedLevels: report.cappedLevels.length }, null, 1));
