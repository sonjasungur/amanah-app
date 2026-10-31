#!/usr/bin/env node
/**
 * QuranEnc condition 6: the translation must follow the latest published version.
 * Compares the stored version with QuranEnc's public list (one read-only GET, no key) and also
 * checks each stored verse against the live text. Exit 1 when an update is due.
 *
 *   node scripts/check-quranenc-version.mjs
 */
import { readFileSync } from "node:fs";

const data = JSON.parse(readFileSync(new URL("../src/lib/knowledge/data/quran-verbatim.json", import.meta.url), "utf8"));
const stored = data.germanTranslation;

async function getJson(url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15_000) });
  if (!res.ok) throw new Error(`${url} answered ${res.status}`);
  return res.json();
}

const list = await getJson("https://quranenc.com/api/v1/translations/list/de");
const live = list.translations?.find((t) => t.key === stored.key);
if (!live) {
  console.error(`Translation ${stored.key} is no longer listed by QuranEnc.`);
  process.exit(1);
}

let outdated = live.version !== stored.version;
console.log(`${stored.key}: stored ${stored.version}, QuranEnc ${live.version}${outdated ? " → UPDATE DUE" : " (current)"}`);

for (const verse of data.verses) {
  const { result } = await getJson(stored.apiUrl.replace("{surah}", verse.surah).replace("{ayah}", verse.ayah));
  const same = result?.translation === verse.german;
  if (!same) outdated = true;
  console.log(`${verse.surah}:${verse.ayah}: ${same ? "identical" : "DIFFERS from QuranEnc"}`);
}

process.exit(outdated ? 1 : 0);
