/**
 * Research register for the knowledge centre (P2.3, checked 2026-11-18). These are verified
 * references for authors and reviewers, not publishable content: nothing here appears on a page.
 * Full findings: docs/release/wissenszentrum-p2-quellen.md.
 *
 * Rules
 * - Qurʾān: only the meaning translation of Bubenheim & Elyas (QuranEnc german_bubenheim). Verbatim
 *   reproduction is allowed by QuranEnc's terms: no change, publisher/source and version named,
 *   kept up to date. Texts live only in data/quran-verbatim.json, fetched, never typed.
 * - Hadith: Sahih al-Bukhari and Sahih Muslim in sunnah.com numbering. sunnah.com refused automated
 *   access (HTTP 403): numbers were confirmed via search excerpts and an open mirror, so every hadith
 *   needs a manual check in the browser before it backs a published statement. No English text is
 *   quoted; renderings are own summaries and marked as such.
 * - Tafsir Ibn Kathir: reference only. The German translation (IB-Verlag, D. Mitterhuber) is a
 *   publisher's work without a free licence; no quotation without the publisher's permission.
 */
export type ReferenceKind = "quran" | "hadith" | "tafsir";
export type Verification = "direkt gelesen" | "Suchauszug" | "Suchauszug und Spiegel";

export interface ResearchReference {
  id: string;
  kind: ReferenceKind;
  /** Human-readable reference, e.g. "Qurʾān 2:180" or "Sahih Muslim 939a". */
  reference: string;
  url: string;
  topic: string;
  verification: Verification;
  checkedAt: string;
  /** "verbatim-allowed" (Qurʾān, terms met), "reference-only" (hadith wording, tafsir). */
  use: "verbatim-allowed" | "reference-only";
  note?: string;
  collection?: "bukhari" | "muslim";
  number?: string;
}

const Q = (surah: number, ayah: number, topic: string, note?: string): ResearchReference => ({
  id: `quran-${surah}-${ayah}`,
  kind: "quran",
  reference: `Qurʾān ${surah}:${ayah}`,
  url: `https://quranenc.com/de/browse/german_bubenheim/${surah}/${ayah}`,
  topic,
  verification: "direkt gelesen",
  checkedAt: "2026-11-18",
  use: "verbatim-allowed",
  note: note ?? "QuranEnc german_bubenheim 1.1.5, ohne Fußnoten.",
});

const H = (collection: "bukhari" | "muslim", number: string, book: string, topic: string, verification: Verification, note?: string): ResearchReference => ({
  id: `${collection}-${number}`,
  kind: "hadith",
  reference: `${collection === "bukhari" ? "Sahih al-Bukhari" : "Sahih Muslim"} ${number} (${book})`,
  url: `https://sunnah.com/${collection}:${number}`,
  topic,
  verification,
  checkedAt: "2026-11-18",
  use: "reference-only",
  collection,
  number,
  note: note ?? "Vor Verwendung im Browser von Hand gegenprüfen (sunnah.com 403 bei automatischem Abruf).",
});

export const RESEARCH_REFERENCES: readonly ResearchReference[] = [
  Q(2, 180, "Vermächtnis (Waṣiyya) und Verantwortung"),
  Q(2, 181, "Vermächtnis nicht abändern"),
  Q(2, 182, "Schlichten bei ungerechtem Vermächtnis"),
  Q(2, 282, "Schulden schriftlich festhalten", "QuranEnc german_bubenheim 1.1.5, ohne Fußnoten. Langer Vers: nur vollständig zitieren (keine Kürzung)."),
  Q(2, 156, "Trauer: „Wir gehören Allah …“", "QuranEnc 1.1.5; der Quelltext beginnt klein und schließt das Anführungszeichen nicht – unverändert übernehmen."),
  Q(3, 185, "Jede Seele wird den Tod kosten"),
  Q(4, 11, "Erbrecht: Kinder und Eltern"),
  Q(4, 12, "Erbrecht: Ehepartner und Geschwister", "QuranEnc 1.1.5; Tippfehler „vom dem“ im Quelltext – unverändert übernehmen und QuranEnc melden."),
  Q(4, 176, "Erbrecht: Seitenverwandte (Kalāla)"),
  H("muslim", "939a", "Buch der Bestattungen, 11/46", "Waschung einer Verstorbenen (Umm ʿAṭiyya)", "Suchauszug", "Wortlaut „drei oder fünf Mal oder mehr“; „ungerade Anzahl“ steht in 939e/939g. Von Hand prüfen."),
  H("muslim", "1631", "Buch der Testamente, 25/20", "Was nach dem Tod weiterwirkt (Sadaqa Jāriya, Wissen, Kind)", "Suchauszug"),
  H("muslim", "1628a", "Buch der Testamente, 25/6", "Vermächtnis bis zu einem Drittel (Saʿd)", "Suchauszug"),
  H("bukhari", "1254", "Bestattungen (Al-Janāʾiz), 23/16", "Waschung (Umm ʿAṭiyya)", "Suchauszug und Spiegel"),
  H("bukhari", "1273", "Bestattungen, 23/34", "Kafan: drei weiße Tücher", "Suchauszug und Spiegel"),
  H("bukhari", "1315", "Bestattungen, 23/72", "Die Bestattung nicht verzögern", "Suchauszug und Spiegel"),
  H("bukhari", "2738", "Testamente (Waṣāyā), 55/1", "Testament schriftlich bereithalten", "Suchauszug und Spiegel"),
  H("bukhari", "2742", "Testamente, 55/5", "Ein Drittel ist viel", "Suchauszug und Spiegel"),
  H("bukhari", "2744", "Testamente, 55/7", "Saʿd bietet die Hälfte an", "Suchauszug und Spiegel"),
  {
    id: "tafsir-ibn-kathir",
    kind: "tafsir",
    reference: "Tafsīr Ibn Kaṯīr, arabische Ausgabe Dār Ṭayba (Riad), Hg. Sāmī as-Salāma",
    url: "https://quran.ksu.edu.sa/tafseer/katheer/sura2-aya180.html",
    topic: "Auslegung zu den oben genannten Versen",
    verification: "Suchauszug",
    checkedAt: "2026-11-18",
    use: "reference-only",
    note: "Jahr und Auflage der Ausgabe am Druckexemplar bestätigen. Deutsche Übersetzung (IB-Verlag, D. Mitterhuber) nur mit Verlagsgenehmigung zitieren.",
  },
];

/** The kinds of book an article may rest on. Anything else needs its own source and authenticity check. */
export const ALLOWED_COLLECTIONS = new Set(["bukhari", "muslim"]);
