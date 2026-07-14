/**
 * Canonical Qur'an verse metadata — Bubenheim/Elyas via QuranEnc.
 * German text is the licensed Bubenheim/Elyas translation; do not paraphrase.
 */
export const QURAN_TRANSLATOR = "Bubenheim & Elyas";
export const QURAN_TRANSLATION_VERSION = "QuranEnc german_bubenheim";
export const QURAN_ATTRIBUTION =
  "Übersetzung: Bubenheim & Elyas (QuranEnc). Keine inhaltliche Umformulierung.";

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
  /** Bubenheim/Elyas German — from QuranEnc german_bubenheim */
  translationDe: string;
  note?: string;
}

/** Verses actually used in the app — verified against QuranEnc german_bubenheim */
export const QURAN_VERSES: Record<string, QuranVerseDef> = {
  "quran-nisa-4-11": {
    id: "quran-nisa-4-11",
    surah: 4,
    verseStart: 11,
    title: "Erbanteile — Söhne und Töchter",
    reference: "Qur'an, Sura an-Nisāʾ 4:11",
    translationDe:
      "Allah hat euch bezüglich eurer Kinder vorgeschrieben: Dem männlichen Geschlecht das Gleiche wie dem weiblichen Geschlecht von dem, was die Eltern und nächsten Verwandten hinterlassen. Wenn es Töchter sind und mehr als zwei, so bekommen sie zwei Drittel von dem, was er hinterlassen hat. Wenn es (nur) eine Tochter ist, so bekommt sie die Hälfte. Und für seine Eltern bekommt jeder von beiden ein Sechstel von dem, was er hinterlassen hat, wenn er Kinder hat. Wenn er keine Kinder hat und seine Eltern ihn beerben, so bekommt seine Mutter ein Drittel. Wenn er Brüder hat, so bekommt seine Mutter ein Sechstel — nach (Erfüllung) eines Vermächtnisses, das er gemacht hat, oder einer Schuld. Eure Väter und eure Söhne — ihr wisst nicht, wer von ihnen euch an Nutzen näher ist. (Das ist) eine Verpflichtung von Allah. Gewiss, Allah ist Allwissend, Allweise.",
    note: "Erbanteile werden nach Vermächtnissen und Schulden angewendet — keine individuelle Erbberatung.",
  },
  "quran-nisa-4-12": {
    id: "quran-nisa-4-12",
    surah: 4,
    verseStart: 12,
    title: "Erbanteile — Ehepartner",
    reference: "Qur'an, Sura an-Nisāʾ 4:12",
    translationDe:
      "Euch ist vorgeschrieben: Eure Frauen erhalten ein Viertel von dem, was ihr hinterlasst, wenn ihr keine Kinder habt. Wenn ihr Kinder habt, so erhalten sie ein Achtel von dem, was ihr hinterlasst — nach (Erfüllung) eines Vermächtnisses, das ihr gemacht habt, oder einer Schuld. Und euch ist vorgeschrieben: Ihr erhaltet die Hälfte von dem, was eure Frauen hinterlassen, wenn sie keine Kinder haben. Wenn sie Kinder haben, so erhaltet ihr ein Viertel von dem, was sie hinterlassen — nach (Erfüllung) eines Vermächtnisses, das sie gemacht haben, oder einer Schuld.",
    note: "Erbregeln setzen Vermächtnisse und Schulden voraus — Einzelheiten fachlich prüfen.",
  },
  "quran-nisa-4-176": {
    id: "quran-nisa-4-176",
    surah: 4,
    verseStart: 176,
    title: "Erbanteile — Geschwister und Kalala",
    reference: "Qur'an, Sura an-Nisāʾ 4:176",
    translationDe:
      "Sie fragen dich um Belehrung. Sag: Allah belehrt euch über den Kalala (den, der keine direkten Erben hat). Wenn jemand stirbt und keine Kinder hat, aber eine Schwester (hinterlässt), so bekommt sie die Hälfte von dem, was er hinterlassen hat. Er beerbt sie, wenn sie keine Kinder hat. Wenn es zwei Schwestern sind, so bekommen sie zwei Drittel von dem, was er hinterlassen hat.",
    note: "Komplexe Erbkonstellationen — Imam/Gelehrte und Anwalt konsultieren.",
  },
  "quran-al-imran-3-185": {
    id: "quran-al-imran-3-185",
    surah: 3,
    verseStart: 185,
    title: "Jeder Seele der Tod",
    reference: "Qur'an, Sura Āl ʿImrān 3:185",
    translationDe:
      "Jede Seele wird den Tod kosten. Und am Tag der Auferstehung wird euch euer Lohn vollständig ausgezahlt. Wer dann vom Feuer ferngehalten und ins Paradies eingelassen wird, der ist erfolgreich. Das irdische Leben ist nur genießbarer Täuschung.",
    note: "Erinnert an die Endlichkeit des Lebens — keine Spekulation über individuelles Schicksal.",
  },
  "quran-al-muminun-23-99": {
    id: "quran-al-muminun-23-99",
    surah: 23,
    verseStart: 99,
    verseEnd: 100,
    title: "Barzakh — Zwischenzustand",
    reference: "Qur'an, Sura al-Mu'minūn 23:99–100",
    translationDe:
      "Wenn der Tod an einen von ihnen herantritt, sagt er: Mein Herr, sende mich zurück, damit ich Gutes tue in dem, was ich zurückgelassen habe. Nein! Das ist nur ein Wort, das er spricht. Hinter ihnen liegt eine Barriere bis zu dem Tag, an dem sie auferweckt werden.",
    note: "Barzakh als Zwischenzustand bis zur Auferstehung — keine Details über das Verborgene.",
  },
  "quran-ash-shura-42-38": {
    id: "quran-ash-shura-42-38",
    surah: 42,
    verseStart: 38,
    title: "Beratung unter Gläubigen",
    reference: "Qur'an, Sura ash-Shūrā 42:38",
    translationDe:
      "Und diejenigen, die auf ihren Herrn hören, das Gebet verrichten, ihre Angelegenheiten durch Beratung untereinander regeln und von dem ausgeben, womit Wir sie versorgt haben.",
    note: "Allgemeines Prinzip für familiäre Beratung — nicht als spezifische Vorsorgeregel.",
  },
  "quran-al-hashr-59-18": {
    id: "quran-al-hashr-59-18",
    surah: 59,
    verseStart: 18,
    title: "An morgen denken",
    reference: "Qur'an, Sura al-Hashr 59:18",
    translationDe:
      "O ihr Gläubigen, fürchtet Allah. Und jeder soll sehen, was er für morgen vorausschickt. Und fürchtet Allah. Gewiss, Allah ist dessen, was ihr tut, Kundig.",
    note: "Motivation für Vorsorge — keine Garantie über individuelles Schicksal.",
  },
};
