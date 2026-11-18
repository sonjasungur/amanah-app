#!/usr/bin/env node
/**
 * P2.5-E source check for the editorial drafts (src/modules/islamic-knowledge/full-articles/archive/p25-drafts-v1.json).
 *
 * 1. Qur'an: every German text is fetched again from the public QuranEnc API (Bubenheim & Elyas) and
 *    compared character by character with the draft. Also reports the translation version.
 * 2. Hadith: every Bukhari/Muslim reference is fetched again from the open mirror named in the draft
 *    and the number is compared. Content and narrator still need a human check on sunnah.com
 *    (automatic requests are blocked there), so this script never marks a hadith as "verified".
 *
 * Read-only, no account, no data of any person. Usage:
 *   node scripts/knowledge/verify-p25-articles.mjs [report.json]
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../../src/modules/islamic-knowledge/full-articles/archive/p25-drafts-v1.json", import.meta.url); // version 1, archived in P2.6
const { articles } = JSON.parse(readFileSync(FILE, "utf8"));
const out = process.argv[2];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function getJson(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (res.ok) return await res.json();
      if (res.status === 404) return null;
    } catch {
      /* retry */
    }
    await sleep(800 * (i + 1));
  }
  throw new Error(`not reachable: ${url}`);
}

const norm = (s) => String(s ?? "").replace(/\s+/g, " ").trim();
const quran = [];
const hadith = [];

for (const a of articles) {
  for (const q of a.quran ?? []) {
    const api = `https://quranenc.com/api/v1/translation/aya/german_bubenheim/${q.surah}/${q.ayah}`;
    const body = await getJson(api);
    const live = body?.result?.translation;
    quran.push({ article: a.id, ref: `${q.surah}:${q.ayah}`, match: norm(live) === norm(q.germanVerbatim), version: body?.result?.version ?? null });
    await sleep(120);
  }
  for (const h of a.sunnah ?? []) {
    let numberMatch = false;
    let note = "";
    if (!/^https:\/\/(raw\.githubusercontent\.com|cdn\.jsdelivr\.net)\/(gh\/)?fawazahmed0\/hadith-api/.test(h.mirrorUrl ?? "")) {
      note = "kein Spiegel-Link";
    } else {
      const body = await getJson(h.mirrorUrl).catch((e) => ({ error: String(e) }));
      const list = body?.hadiths ?? [];
      const want = String(h.number).replace(/[a-z]$/i, "");
      if (h.collection === "bukhari") numberMatch = list.some((x) => String(x.hadithnumber) === want || String(x.arabicnumber).split(".")[0] === want);
      else if (h.collection === "muslim") numberMatch = list.some((x) => String(x.arabicnumber).split(".")[0] === want);
      else note = `Sammlung nicht zugelassen: ${h.collection}`;
      if (body?.error) note = body.error;
    }
    hadith.push({ article: a.id, ref: `${h.collection} ${h.number}`, numberMatch, note });
    await sleep(80);
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  quran: { total: quran.length, exact: quran.filter((q) => q.match).length, versions: [...new Set(quran.map((q) => q.version))], mismatches: quran.filter((q) => !q.match) },
  hadith: { total: hadith.length, numberMatch: hadith.filter((h) => h.numberMatch).length, problems: hadith.filter((h) => !h.numberMatch) },
};
console.log(JSON.stringify({ quran: { ...report.quran, mismatches: report.quran.mismatches.length }, hadith: { ...report.hadith, problems: report.hadith.problems.length } }, null, 1));
if (out) writeFileSync(out, JSON.stringify(report, null, 1));
process.exit(report.quran.mismatches.length || report.hadith.problems.length ? 1 : 0);
