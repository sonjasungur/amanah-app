import verbatim from "./data/quran-verbatim.json";

/**
 * Canonical Qur'an verses. Arabic and German texts come verbatim from
 * data/quran-verbatim.json (Tanzil Uthmani 1.1 / QuranEnc german_bubenheim) and must
 * never be edited, shortened or paraphrased here. Titles and notes are editorial and
 * kept separate from the verse text. Previous texts: islamic-knowledge/archive/.
 */
export const QURAN_TRANSLATOR = verbatim.germanTranslation.translators;
export const QURAN_TRANSLATION_VERSION = `QuranEnc ${verbatim.germanTranslation.key} ${verbatim.germanTranslation.version}`;
export const QURAN_ATTRIBUTION =
  `Übersetzung: ${verbatim.germanTranslation.translators}. Quelle: QuranEnc.com, Version ${verbatim.germanTranslation.version}. ` +
  "Arabischer Text: Tanzil Project (tanzil.net), CC BY 3.0. Unveränderte Wiedergabe.";

export function quranEncUrl(surah: number, verse: number): string {
  return `https://quranenc.com/en/browse/german_bubenheim/${surah}/${verse}`;
}

export interface QuranVerseDef {
  id: string;
  surah: number;
  verseStart: number;
  verseEnd?: number;
  title: string;
  reference: string;
  /** Verbatim QuranEnc german_bubenheim text of all verses in the range. */
  translationDe: string;
  /** Verbatim Tanzil Uthmani text of all verses in the range. */
  arabicText: string;
  note?: string;
}

type VerseMeta = Omit<QuranVerseDef, "translationDe" | "arabicText">;

function verse(surah: number, ayah: number) {
  const found = verbatim.verses.find((v) => v.surah === surah && v.ayah === ayah);
  if (!found) throw new Error(`Qur'an ${surah}:${ayah} missing in quran-verbatim.json`);
  return found;
}

function withText(meta: VerseMeta): QuranVerseDef {
  const end = meta.verseEnd ?? meta.verseStart;
  const ayat = Array.from({ length: end - meta.verseStart + 1 }, (_, i) => verse(meta.surah, meta.verseStart + i));
  return {
    ...meta,
    translationDe: ayat.map((a) => a.german).join(" "),
    arabicText: ayat.map((a) => a.arabic).join(" "),
  };
}

const VERSE_META: VerseMeta[] = [
  {
    id: "quran-nisa-4-11",
    surah: 4,
    verseStart: 11,
    title: "Erbanteile — Kinder und Eltern",
    reference: "Qur'an, Sura an-Nisāʾ 4:11",
    note: "Erbanteile werden nach Vermächtnissen und Schulden angewendet — keine individuelle Erbberatung.",
  },
  {
    id: "quran-nisa-4-12",
    surah: 4,
    verseStart: 12,
    title: "Erbanteile — Ehepartner und Geschwister mütterlicherseits",
    reference: "Qur'an, Sura an-Nisāʾ 4:12",
    note: "Erbregeln setzen Vermächtnisse und Schulden voraus — Einzelheiten fachlich prüfen.",
  },
  {
    id: "quran-nisa-4-176",
    surah: 4,
    verseStart: 176,
    title: "Erbanteile — seitliche Verwandtschaft (Kalāla)",
    reference: "Qur'an, Sura an-Nisāʾ 4:176",
    note: "Kalāla bezeichnet die Erbfolge ohne Kinder und Vater. Komplexe Konstellationen — Gelehrte und Anwalt konsultieren.",
  },
  {
    id: "quran-al-imran-3-185",
    surah: 3,
    verseStart: 185,
    title: "Jede Seele wird den Tod kosten",
    reference: "Qur'an, Sura Āl ʿImrān 3:185",
    note: "Erinnert an die Endlichkeit des Lebens — keine Spekulation über individuelles Schicksal.",
  },
  {
    id: "quran-al-muminun-23-99",
    surah: 23,
    verseStart: 99,
    verseEnd: 100,
    title: "Barzakh — Zwischenzustand",
    reference: "Qur'an, Sura al-Muʾminūn 23:99–100",
    note: "Barzakh als Zwischenzustand bis zur Auferstehung — keine Details über das Verborgene.",
  },
  {
    id: "quran-ash-shura-42-38",
    surah: 42,
    verseStart: 38,
    title: "Beratung unter Gläubigen",
    reference: "Qur'an, Sura ash-Shūrā 42:38",
    note: "Allgemeines Prinzip für familiäre Beratung — nicht als spezifische Vorsorgeregel.",
  },
  {
    id: "quran-al-hashr-59-18",
    surah: 59,
    verseStart: 18,
    title: "An morgen denken",
    reference: "Qur'an, Sura al-Ḥashr 59:18",
    note: "Motivation für Vorsorge — keine Garantie über individuelles Schicksal.",
  },
];

export const QURAN_VERSES: Record<string, QuranVerseDef> = Object.fromEntries(
  VERSE_META.map((meta) => [meta.id, withText(meta)])
);
