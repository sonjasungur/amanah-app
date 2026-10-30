/**
 * ARCHIVE — hadith records as shipped until 2026-10-30. Do not import in the app.
 * Findings: docs/strategy/05-quellenpruefung.md; corrections: docs/strategy/09-quellenkorrektur.md.
 * - hadith-bukhari-janazah-1254: number points to the ghusl of the Prophet's daughter; the Qirat hadith is Bukhari 1325.
 * - hadith-bukhari-janazah-1273: number points to the three white shrouds; the grave-visit wording is Tirmidhi 1054 (cf. Muslim 977a).
 * - hadith-wasiyyah-saad: Bukhari 2738 is the written-will hadith; the Saʿd narration is 2742/2744/1295.
 * - hadith-debts-deceased: number correct, wording inaccurate.
 * Original file: src/lib/knowledge/sources.ts at commit 1fdb5db (verbatim below; hadithSource() unwrapped).
 */
export const ARCHIVED_HADITH_RECORDS_2026_10_30: Record<string, Record<string, unknown>> = {
  "hadith-bukhari-janazah-1254": {
    title: "Belohnung für Janazah-Gebet",
    reference: "Sahih al-Bukhari, Hadith 1254",
    translationDe:
      "Wer einer Leichenbegleitung folgt und das Janazah-Gebet verrichtet, erhält eine Belohnung wie ein Qirat — und wer wartet, bis begraben ist, erhält zwei Qirat.",
    note: "Sinngemäße deutsche Wiedergabe — Größe der Belohnung ist bei Allah.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "1254",
    url: "https://sunnah.com/bukhari:1254",
  },
  "hadith-bukhari-janazah-1273": {
    title: "Besuch von Gräbern",
    reference: "Sahih al-Bukhari, Hadith 1273",
    translationDe:
      "Ich hatte euch verboten, Gräber zu besuchen; nun besucht sie, denn sie erinnern an das Jenseits.",
    note: "Sinngemäße deutsche Wiedergabe — anderer Kontext als Janazah-Beschleunigung.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "1273",
    url: "https://sunnah.com/bukhari:1273",
  },
  "hadith-wasiyyah-saad": {
    title: "Saʿd ibn Abī Waqqāṣ — Vermächtnis",
    reference: "Sahih al-Bukhari, Hadith 2738",
    translationDe:
      "Saʿd wollte fast sein gesamtes Vermögen spenden. Der Prophet (Friede sei auf ihm) sagte: Ein Drittel, und ein Drittel ist viel.",
    note: "Sinngemäße deutsche Wiedergabe — Kontext zur Wasiyyah-Grenze.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "2738",
    url: "https://sunnah.com/bukhari:2738",
  },
  "hadith-debts-deceased": {
    title: "Ernsthaftigkeit von Schulden",
    reference: "Sahih al-Bukhari, Hadith 2289",
    translationDe:
      "Ein Mann starb und hinterließ Schulden. Der Gesandte Allahs (Friede sei auf ihm) fragte, wer die Schulden für ihn übernehmen würde. Abu Qatada sagte, er übernehme sie. Daraufhin verrichtete er das Totengebet für ihn.",
    note: "Verdeutlicht die Ernsthaftigkeit offener Schulden — ersetzt keine individuelle Beurteilung.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "2289",
    url: "https://sunnah.com/bukhari:2289",
  },
};
