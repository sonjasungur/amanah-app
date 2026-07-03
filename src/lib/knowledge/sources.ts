import type { IslamicSource } from "@/lib/types";

export const islamicSources: Record<string, IslamicSource> = {
  "quran-nisa-4-11": {
    id: "quran-nisa-4-11",
    type: "quran",
    title: "Erbanteile — Söhne und Töchter",
    reference: "Qur'an, Sura an-Nisāʾ 4:11",
    translationDe:
      "Allah hat euch bezüglich eurer Kinder vorgeschrieben: Dem männlichen Geschlecht das Gleiche wie dem weiblichen Geschlecht von dem, was die Eltern und nächsten Verwandten hinterlassen.",
    note: "Bei Detailfragen bitte Imam/Gelehrte fragen.",
  },
  "quran-nisa-4-12": {
    id: "quran-nisa-4-12",
    type: "quran",
    title: "Erbanteile — Ehepartner",
    reference: "Qur'an, Sura an-Nisāʾ 4:12",
    translationDe:
      "Euch ist vorgeschrieben: Eure Frauen erhalten ein Viertel von dem, was ihr hinterlasst, wenn ihr keine Kinder habt.",
    note: "Bei Detailfragen bitte Imam/Gelehrte fragen.",
  },
  "quran-nisa-4-176": {
    id: "quran-nisa-4-176",
    type: "quran",
    title: "Erbanteile — Geschwister",
    reference: "Qur'an, Sura an-Nisāʾ 4:176",
    translationDe:
      "Sie fragen dich um Belehrung. Sag: Allah belehrt euch über den alleinigen Erben.",
    note: "Bei Geschwister- und komplexen Erbkonstellationen Imam/Gelehrte und Anwalt konsultieren.",
  },
  "hadith-sadaqa-jariya": {
    id: "hadith-sadaqa-jariya",
    type: "hadith",
    title: "Drei fortlaufende Taten nach dem Tod",
    reference: "Sahih Muslim / Riyad as-Salihin — Hadith über fortlaufende Taten",
    translationDe:
      "Wenn der Mensch stirbt, enden seine Taten außer drei: fortlaufende Sadaqa, nützliches Wissen und ein rechtschaffenes Kind, das für ihn bittet.",
    note: "Genaue Hadithnummer in fachlicher Prüfung.",
  },
  "hadith-janazah-hasten": {
    id: "hadith-janazah-hasten",
    type: "hadith",
    title: "Janazah nicht verzögern",
    reference: "Sahih al-Bukhari — Hadith über Beschleunigung der Janazah",
    translationDe:
      "Beschleunigt die Janazah. Wenn sie rechtschaffen war, ist es ein Gutes, das ihr ihr zukommen lasst. Wenn sie anders war, ist es ein Übel, das ihr von euch abwendet.",
    note: "Genaue Hadithnummer in fachlicher Prüfung.",
  },
  "hadith-wasiyyah-third": {
    id: "hadith-wasiyyah-third",
    type: "hadith",
    title: "Waṣiyya bis maximal ein Drittel",
    reference: "Hadith von Saʿd ibn Abī Waqqāṣ",
    translationDe:
      "Ein Drittel, und ein Drittel ist viel.",
    note: "Klassische Begrenzung der freien Verfügung. Details mit Imam/Gelehrten prüfen.",
  },
  "hadith-debts": {
    id: "hadith-debts",
    type: "hadith",
    title: "Schulden des Verstorbenen",
    reference: "Hadithe über Schulden und Verantwortung vor dem Totengebet",
    translationDe:
      "Schulden des Verstorbenen müssen vor der Verteilung des Erbes beglichen werden.",
    note: "Referenz zu prüfen — needsScholarReview.",
  },
  "quran-barzakh": {
    id: "quran-barzakh",
    type: "quran",
    title: "Barzakh — Zwischenzustand",
    reference: "Qur'an, Sura al-Mu'minūn 23:99–100",
    translationDe:
      "Wenn der Tod an einen von ihnen herantritt, sagt er: Mein Herr, sende mich zurück, damit ich Gutes tue in dem, was ich zurückgelassen habe. Nein! Das ist nur ein Wort, das er spricht.",
    note: "Barzakh als Zwischenzustand bis zur Auferstehung.",
  },
  "fiqh-ghusl-kafan": {
    id: "fiqh-ghusl-kafan",
    type: "fiqh",
    title: "Ghusl, Kafan und Janazah-Gebet",
    reference: "Klassische Fiqh-Literatur — zu prüfen",
    translationDe:
      "Der Verstorbene wird gewaschen (Ghusl), in Leichentücher (Kafan) gehüllt und das Janazah-Gebet wird verrichtet.",
    note: "Detailfragen unterliegen Meinungsunterschieden. Imam/Gelehrte fragen.",
  },
  "official-patientenverfuegung": {
    id: "official-patientenverfuegung",
    type: "official",
    title: "Patientenverfügung — Bundesgesundheitsministerium",
    reference: "Bundesgesundheitsministerium",
    url: "https://www.bundesgesundheitsministerium.de/themen/pflege/patientenverfuegung.html",
    translationDe:
      "Mit einer Patientenverfügung legen Sie fest, welche medizinischen Maßnahmen Sie wünschen oder ablehnen.",
  },
  "official-vorsorgevollmacht": {
    id: "official-vorsorgevollmacht",
    type: "official",
    title: "Vorsorgevollmacht — Bundesjustizministerium",
    reference: "Bundesjustizministerium",
    url: "https://www.bmjv.de/DE/themen/familie_und_partnerschaft/vorsorgevollmacht/vorsorgevollmacht_node.html",
    translationDe:
      "Mit einer Vorsorgevollmacht bestimmen Sie eine Person, die in Ihrem Namen handeln darf.",
  },
  "fiqh-janazah-basics": {
    id: "fiqh-janazah-basics",
    type: "fiqh",
    title: "Grundlagen der islamischen Bestattung",
    reference: "Klassische Fiqh-Literatur — zu prüfen",
    translationDe:
      "Die islamische Bestattung umfasst Ghusl, Kafan, Janazah-Gebet und Beisetzung.",
    note: "Bei Detailfragen Imam/Gelehrte fragen.",
  },
};

export function getSourcesByIds(ids: string[]): IslamicSource[] {
  return ids.map((id) => islamicSources[id]).filter(Boolean);
}
