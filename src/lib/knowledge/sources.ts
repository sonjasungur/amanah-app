import type { IslamicSource } from "@/lib/types";
import { dedupePrimarySources } from "@/lib/knowledge/source-dedup";
import {
  QURAN_ATTRIBUTION,
  QURAN_TRANSLATION_VERSION,
  QURAN_TRANSLATOR,
  QURAN_VERSES,
  quranEncUrl,
} from "@/lib/knowledge/quran-verses";

const JANAZAH_HASTEN_GROUP = "janazah-hasten";

function quranSource(verseId: keyof typeof QURAN_VERSES): IslamicSource {
  const v = QURAN_VERSES[verseId];
  return {
    id: v.id,
    type: "quran",
    title: v.title,
    reference: v.reference,
    translationDe: v.translationDe,
    note: v.note,
    auditCategory: "QURAN_PRIMARY",
    quranEncUrl: quranEncUrl(v.surah, v.verseStart),
    translator: QURAN_TRANSLATOR,
    translationVersion: QURAN_TRANSLATION_VERSION,
    isParaphrase: false,
    url: quranEncUrl(v.surah, v.verseStart),
  };
}

function hadithSource(
  id: string,
  opts: Omit<IslamicSource, "id" | "type" | "auditCategory"> & { auditCategory?: IslamicSource["auditCategory"] }
): IslamicSource {
  return {
    id,
    type: "hadith",
    auditCategory: "SAHIH_PRIMARY",
    ...opts,
  };
}

export const islamicSources: Record<string, IslamicSource> = {
  ...Object.fromEntries(
    Object.keys(QURAN_VERSES).map((id) => [id, quranSource(id as keyof typeof QURAN_VERSES)])
  ),

  /** Unified narration — Bukhari 1315 / Muslim 944c (same content) */
  "hadith-janazah-hasten": hadithSource("hadith-janazah-hasten", {
    title: "Janazah beschleunigen",
    reference: "Sahih al-Bukhari, Hadith 1315 · Sahih Muslim, Hadith 944c",
    translationDe:
      "Beschleunigt die Janazah. Wenn sie rechtschaffen war, ist es ein Gutes, das ihr ihr zukommen lasst. Wenn sie anders war, ist es ein Übel, das ihr von euch abwendet.",
    note: "Sinngemäße deutsche Wiedergabe — keine individuelle Fatwa.",
    isParaphrase: true,
    sourceGroup: JANAZAH_HASTEN_GROUP,
    collection: "bukhari",
    hadithNumber: "1315",
    url: "https://sunnah.com/bukhari:1315",
  }),

  "hadith-bukhari-janazah-1254": hadithSource("hadith-bukhari-janazah-1254", {
    title: "Belohnung für Janazah-Gebet",
    reference: "Sahih al-Bukhari, Hadith 1254",
    translationDe:
      "Wer einer Leichenbegleitung folgt und das Janazah-Gebet verrichtet, erhält eine Belohnung wie ein Qirat — und wer wartet, bis begraben ist, erhält zwei Qirat.",
    note: "Sinngemäße deutsche Wiedergabe — Größe der Belohnung ist bei Allah.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "1254",
    url: "https://sunnah.com/bukhari:1254",
  }),

  "hadith-bukhari-janazah-1273": hadithSource("hadith-bukhari-janazah-1273", {
    title: "Besuch von Gräbern",
    reference: "Sahih al-Bukhari, Hadith 1273",
    translationDe:
      "Ich hatte euch verboten, Gräber zu besuchen; nun besucht sie, denn sie erinnern an das Jenseits.",
    note: "Sinngemäße deutsche Wiedergabe — anderer Kontext als Janazah-Beschleunigung.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "1273",
    url: "https://sunnah.com/bukhari:1273",
  }),

  "hadith-sadaqa-jariya": hadithSource("hadith-sadaqa-jariya", {
    title: "Drei fortlaufende Taten nach dem Tod",
    reference: "Sahih Muslim, Hadith 1631",
    translationDe:
      "Wenn der Mensch stirbt, enden seine Taten außer drei: fortlaufende Sadaqa, nützliches Wissen und ein rechtschaffenes Kind, das für ihn bittet.",
    note: "Sinngemäße deutsche Wiedergabe — keine Garantie religiöser Belohnung.",
    isParaphrase: true,
    collection: "muslim",
    hadithNumber: "1631",
    url: "https://sunnah.com/muslim:1631",
  }),

  "hadith-wasiyyah-third": hadithSource("hadith-wasiyyah-third", {
    title: "Waṣiyya bis maximal ein Drittel",
    reference: "Sahih al-Bukhari, Hadith 2742 · Sahih Muslim, Hadith 1628a",
    translationDe: "Ein Drittel, und ein Drittel ist viel.",
    note: "Begrenzung der freien Verfügung (Waṣiyya) — in Deutschland mit Anwalt/Imam prüfen.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "2742",
    url: "https://sunnah.com/bukhari:2742",
  }),

  "hadith-wasiyyah-saad": hadithSource("hadith-wasiyyah-saad", {
    title: "Saʿd ibn Abī Waqqāṣ — Vermächtnis",
    reference: "Sahih al-Bukhari, Hadith 2738",
    translationDe:
      "Saʿd wollte fast sein gesamtes Vermögen spenden. Der Prophet (Friede sei auf ihm) sagte: Ein Drittel, und ein Drittel ist viel.",
    note: "Sinngemäße deutsche Wiedergabe — Kontext zur Wasiyyah-Grenze.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "2738",
    url: "https://sunnah.com/bukhari:2738",
  }),

  "hadith-debts-deceased": hadithSource("hadith-debts-deceased", {
    title: "Ernsthaftigkeit von Schulden",
    reference: "Sahih al-Bukhari, Hadith 2289",
    translationDe:
      "Ein Mann starb und hinterließ Schulden. Der Gesandte Allahs (Friede sei auf ihm) fragte, wer die Schulden für ihn übernehmen würde. Abu Qatada sagte, er übernehme sie. Daraufhin verrichtete er das Totengebet für ihn.",
    note: "Verdeutlicht die Ernsthaftigkeit offener Schulden — ersetzt keine individuelle Beurteilung.",
    isParaphrase: true,
    collection: "bukhari",
    hadithNumber: "2289",
    url: "https://sunnah.com/bukhari:2289",
  }),

  "fiqh-ghusl-kafan": {
    id: "fiqh-ghusl-kafan",
    type: "fiqh",
    title: "Ghusl, Kafan und Janazah-Gebet",
    reference: "Klassische Fiqh-Literatur — fachlich prüfen",
    translationDe:
      "Der Verstorbene wird gewaschen (Ghusl), in Leichentücher (Kafan) gehüllt und das Janazah-Gebet wird verrichtet.",
    note: "Detailfragen unterliegen Meinungsunterschieden. Imam/Gelehrte fragen.",
    auditCategory: "FIQH_REVIEW_REQUIRED",
  },

  "fiqh-janazah-basics": {
    id: "fiqh-janazah-basics",
    type: "fiqh",
    title: "Grundlagen der islamischen Bestattung",
    reference: "Klassische Fiqh-Literatur — fachlich prüfen",
    translationDe:
      "Die islamische Bestattung umfasst Ghusl, Kafan, Janazah-Gebet und Beisetzung.",
    note: "Bei Detailfragen Imam/Gelehrte fragen.",
    auditCategory: "FIQH_REVIEW_REQUIRED",
  },

  "official-patientenverfuegung-bmj": {
    id: "official-patientenverfuegung-bmj",
    type: "official",
    title: "Patientenverfügung — Bundesministerium für Gesundheit",
    reference: "BMG — offizielle Informationen",
    url: "https://www.bundesgesundheitsministerium.de/themen/pflege/patientenverfuegung.html",
    translationDe:
      "Mit einer Patientenverfügung legen Sie fest, welche medizinischen Maßnahmen Sie wünschen oder ablehnen, wenn Sie nicht mehr entscheidungsfähig sind.",
    auditCategory: "LEGAL_GERMANY",
  },

  "official-patientenverfuegung-vz": {
    id: "official-patientenverfuegung-vz",
    type: "official",
    title: "Patientenverfügung — Verbraucherzentrale",
    reference: "Verbraucherzentrale — Muster und Beratung",
    url: "https://www.verbraucherzentrale.de/wissen/gesundheit-pflege/patientenverfuegung-13921",
    translationDe:
      "Die Verbraucherzentrale bietet Muster, Checklisten und Beratung zur Patientenverfügung nach deutschem Recht.",
    auditCategory: "LEGAL_GERMANY",
  },

  "official-vorsorgevollmacht": {
    id: "official-vorsorgevollmacht",
    type: "official",
    title: "Vorsorgevollmacht — Bundesjustizministerium",
    reference: "BMJV — offizielle Informationen",
    url: "https://www.bmjv.de/DE/themen/familie_und_partnerschaft/vorsorgevollmacht/vorsorgevollmacht_node.html",
    translationDe:
      "Mit einer Vorsorgevollmacht bestimmen Sie eine Person, die in Ihrem Namen handeln darf, wenn Sie es selbst nicht können.",
    auditCategory: "LEGAL_GERMANY",
  },

  "partner-gemeinsam1-sadaqa": {
    id: "partner-gemeinsam1-sadaqa",
    type: "official",
    title: "Gemeinsam1 e.V. — Partner für Sadaqa Jariya",
    reference: "Partnerorganisation",
    url: "https://gemeinsam1.de/?utm_source=meinwille&utm_medium=partner&utm_campaign=sadaqa-jariya",
    translationDe:
      "Gemeinsam1 e.V. unterstützt Bildungs- und Hilfsprojekte als dauerhafte Sadaqa Jariya. Partnerlink — keine religiöse Bewertung der Organisation durch Mein Wille.",
    note: "Partnerkennzeichnung — Spendenentscheidung liegt bei dir.",
    auditCategory: "GENERAL_GUIDANCE",
  },
};

/** @deprecated use hadith-janazah-hasten — kept for migration tests */
export const LEGACY_SOURCE_ALIASES: Record<string, string> = {
  "hadith-bukhari-janazah-1315": "hadith-janazah-hasten",
  "hadith-muslim-janazah-944c": "hadith-janazah-hasten",
  "official-patientenverfuegung": "official-patientenverfuegung-bmj",
  "quran-barzakh": "quran-al-muminun-23-99",
};

export function resolveSourceId(id: string): string {
  return LEGACY_SOURCE_ALIASES[id] ?? id;
}

export function getSourcesByIds(ids: string[]): IslamicSource[] {
  const resolved = ids.map((id) => resolveSourceId(id));
  const unique = [...new Set(resolved)];
  return unique.map((id) => islamicSources[id]).filter(Boolean);
}

/** Only Qur'an and Sahih hadith — deduplicated by sourceGroup */
export function getPrimarySourcesByIds(ids: string[]): IslamicSource[] {
  const sources = getSourcesByIds(ids).filter((s) => s.type === "quran" || s.type === "hadith");
  return dedupePrimarySources(sources);
}

export function getSourcesByCategory(ids: string[]) {
  const sources = getSourcesByIds(ids);
  const grouped = new Map<string, IslamicSource[]>();
  for (const s of sources) {
    const cat = s.auditCategory ?? (s.type === "quran" ? "QURAN_PRIMARY" : s.type === "hadith" ? "SAHIH_PRIMARY" : "GENERAL_GUIDANCE");
    const list = grouped.get(cat) ?? [];
    list.push(s);
    grouped.set(cat, list);
  }
  return grouped;
}

export { QURAN_ATTRIBUTION };
