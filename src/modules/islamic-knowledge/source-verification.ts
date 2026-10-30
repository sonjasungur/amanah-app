/**
 * Result of the source check and corrections of 2026-10-30 (automated cross-check against QuranEnc
 * german_bubenheim, hadith-api/ihadis mirrors of sunnah.com numbering, and URL fetches).
 * Reports: docs/strategy/05-quellenpruefung.md, docs/strategy/09-quellenkorrektur.md.
 *
 * This register only blocks. "checked_ok" is not a replacement for the human source
 * review recorded on each article; unknown IDs count as unchecked.
 */
export type SourceCheckStatus = "checked_ok" | "needs_correction";

export interface SourceCheck {
  status: SourceCheckStatus;
  checkedAt: string;
  finding: string;
}

const CHECKED_AT = "2026-10-30";

const VERBATIM =
  "Wörtlich: Deutsch QuranEnc german_bubenheim 1.1.4, Arabisch Tanzil Uthmani 1.1 (data/quran-verbatim.json, gegen beide Quellen abgeglichen). Lizenzbestätigung der Rechteinhaber offen.";

function ok(finding: string): SourceCheck {
  return { status: "checked_ok", checkedAt: CHECKED_AT, finding };
}

function fix(finding: string): SourceCheck {
  return { status: "needs_correction", checkedAt: CHECKED_AT, finding };
}

export const SOURCE_CHECKS: Record<string, SourceCheck> = {
  "quran-nisa-4-11": ok(VERBATIM),
  "quran-nisa-4-12": ok(VERBATIM),
  "quran-nisa-4-176": ok(VERBATIM),
  "quran-al-imran-3-185": ok(VERBATIM),
  "quran-al-muminun-23-99": ok(VERBATIM),
  "quran-ash-shura-42-38": ok(VERBATIM),
  "quran-al-hashr-59-18": ok(VERBATIM),
  "hadith-janazah-hasten": ok("Bukhari 1315 / Muslim 944c passen; Wiedergabe als Paraphrase gekennzeichnet."),
  "hadith-sadaqa-jariya": ok("Muslim 1631 passt."),
  "hadith-wasiyyah-third": ok("Bukhari 2742 / Muslim 1628a passen."),
  "hadith-janazah-qirat": ok("Bukhari 1325 passt zur Wiedergabe (vorher fälschlich 1254)."),
  "hadith-ghusl-umm-atiyya": ok("Bukhari 1254: Waschung der Tochter des Propheten (Umm ʿAṭiyya)."),
  "hadith-kafan-three-white": ok("Bukhari 1273: drei weiße Tücher."),
  "hadith-graves-visit": ok("Tirmidhi 1054 mit Gradierungen; Muslim 977a ohne Jenseits-Zusatz."),
  "hadith-wasiyyah-saad": ok("Bukhari 2744 (Saʿd bietet die Hälfte an)."),
  "hadith-wasiyya-written": ok("Bukhari 2738: Testament schriftlich bereithalten."),
  "hadith-debts-deceased": ok("Bukhari 2289, Wiedergabe korrigiert (Gebet zunächst verweigert)."),
  "fiqh-ghusl-kafan": fix("Kein konkretes Werk, Band oder Kapitel."),
  "fiqh-janazah-basics": fix("Kein konkretes Werk, Band oder Kapitel."),
  "official-patientenverfuegung-bmj": fix("URL liefert 404."),
  "official-patientenverfuegung-vz": fix("URL liefert 404; Ersatz nicht ermittelt."),
  "official-vorsorgevollmacht": fix("URL liefert 404."),
  "partner-gemeinsam1-sadaqa": ok("URL erreichbar; Partnerlink, keine Behördenquelle."),
};

export function getSourceCheck(sourceId: string): SourceCheck | undefined {
  return SOURCE_CHECKS[sourceId];
}

/** Sources that keep an article from being published. */
export function blockingSources(sourceIds: string[]): string[] {
  return sourceIds.filter((id) => SOURCE_CHECKS[id]?.status !== "checked_ok");
}
