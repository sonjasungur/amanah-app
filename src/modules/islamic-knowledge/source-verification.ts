/**
 * Result of the source check of 2026-10-30 (automated cross-check against QuranEnc
 * german_bubenheim, hadith-api/ihadis mirrors of sunnah.com numbering, and URL fetches).
 * Report: docs/strategy/04-wissenszentrum.md, Anhang Quellenprüfung.
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

function ok(finding: string): SourceCheck {
  return { status: "checked_ok", checkedAt: CHECKED_AT, finding };
}

function fix(finding: string): SourceCheck {
  return { status: "needs_correction", checkedAt: CHECKED_AT, finding };
}

export const SOURCE_CHECKS: Record<string, SourceCheck> = {
  "quran-nisa-4-11": fix("Kritisch: Text besagt gleiche Anteile für Söhne und Töchter; Bubenheim/Elyas: dem Männlichen so viel wie zwei Weiblichen. Kein wörtliches Zitat, obwohl als Übersetzung ausgewiesen."),
  "quran-nisa-4-12": fix("Gekürzt und umgestellt ohne Kennzeichnung; kein wörtliches Bubenheim/Elyas-Zitat."),
  "quran-nisa-4-176": fix("Gekürzt, Glosse im Verstext; kein wörtliches Zitat."),
  "quran-al-imran-3-185": fix("„erst“ fehlt (theologisch relevant), Satzende fehlerhaft."),
  "quran-al-muminun-23-99": fix("Sinn stimmt, Wortlaut weicht ab — wörtlich übernehmen oder als Paraphrase kennzeichnen."),
  "quran-ash-shura-42-38": fix("Sinn stimmt, Wortlaut weicht leicht ab."),
  "quran-al-hashr-59-18": fix("Sinn stimmt, Wortlaut weicht leicht ab."),
  "hadith-janazah-hasten": ok("Bukhari 1315 / Muslim 944c passen; Wiedergabe als Paraphrase gekennzeichnet."),
  "hadith-sadaqa-jariya": ok("Muslim 1631 passt."),
  "hadith-wasiyyah-third": ok("Bukhari 2742 / Muslim 1628a passen."),
  "hadith-bukhari-janazah-1254": fix("Bukhari 1254 ist die Waschung der Tochter des Propheten; der zitierte Qirat-Hadith ist Bukhari 1325."),
  "hadith-bukhari-janazah-1273": fix("Bukhari 1273 sind die drei weißen Tücher; Gräberbesuch-Hadith steht in Muslim 977a (ohne Jenseits-Zusatz) bzw. Tirmidhi 1054 (Gradierung nötig)."),
  "hadith-wasiyyah-saad": fix("Bukhari 2738 betrifft das schriftliche Testament; Saʿd-Erzählung in 2742/2744/1295."),
  "hadith-debts-deceased": fix("Bukhari 2289 ungenau wiedergegeben (Totengebet zunächst verweigert, bis Abu Qatada die Schuld übernahm)."),
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
