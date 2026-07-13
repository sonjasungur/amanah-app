import type { CultureFilterCard } from "@/lib/types";

export const cultureFilterCards: CultureFilterCard[] = [
  {
    id: "kultur-ueberfuehrung",
    question: "Muss der Verstorbene in die Heimat überführt werden?",
    islamicBasis:
      "Islamisch ist eine würdige und zeitnahe Beisetzung wichtig. Die Überführung ist keine religiöse Pflicht, sondern eine familiäre und praktische Entscheidung.",
    culturalPractice:
      "In vielen Herkunftsländern ist die Überführung stark verbreitet und wird als Ehre der Familie empfunden.",
    whatToCheck:
      "Rechtliche Fristen, Kosten, Dokumente, Wünsche des Verstorbenen und islamische Grundsätze der zeitnahen Beisetzung.",
    opinionDifferences: "Gelehrte unterscheiden sich bei der Bewertung von Verzögerungen durch Überführung.",
    sourceIds: ["hadith-janazah-hasten", "fiqh-janazah-basics"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-7-40-52",
    question: "Sind der 7., 40. und 52. Tag islamisch vorgeschrieben?",
    islamicBasis:
      "Diese Trauertage sind nicht aus Quran oder authentischen Hadithen als Pflicht belegt.",
    culturalPractice:
      "In vielen Kulturen (türkisch, bosnisch, arabisch u.a.) sind Gedenkessen und Zeremonien an diesen Tagen verbreitet.",
    whatToCheck:
      "Unterscheide zwischen kultureller Gewohnheit und islamischer Pflicht. Vermeide finanzielle Belastung der Familie.",
    sourceIds: ["hadith-janazah-hasten"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-traueressen",
    question: "Sind große Traueressen islamisch vorgeschrieben?",
    islamicBasis:
      "Das Trösten der Familie (Ta'ziyah) ist empfohlen, aber aufwendige Pflichtfeiern sind nicht islamisch vorgeschrieben.",
    culturalPractice:
      "Große Traueressen sind in vielen muslimischen Kulturen üblich und werden als Zeichen des Respekts gesehen.",
    whatToCheck:
      "Vermeide Verschwendung und finanzielle Belastung. Einfaches Trösten und Dua ist ausreichend.",
    sourceIds: ["hadith-sadaqa-jariya"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-quran-geld",
    question: "Darf man Quran gegen Geld lesen lassen?",
    islamicBasis:
      "Das Lesen des Quran und Bittgebet für den Verstorbenen sind empfohlen. Bezahlte Quran-Lesungen sind umstritten.",
    culturalPractice:
      "In einigen Regionen ist es üblich, professionelle Quran-Leser zu engagieren.",
    whatToCheck: "Imam/Gelehrte fragen. Sadaqa Jariya und Dua sind sicherere Wege.",
    opinionDifferences: "Stark umstritten unter Gelehrten.",
    sourceIds: ["hadith-sadaqa-jariya"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-lautes-klagen",
    question: "Ist lautes Klagen und übertriebene Trauer erlaubt?",
    islamicBasis:
      "Der Prophet ﷺ hat vor übertriebener Trauer und Selbstverletzung gewarnt. Sanftes Weinen ist natürlich.",
    culturalPractice:
      "Lautes Klagen und rituelle Trauergesänge sind in einigen Kulturen verbreitet.",
    whatToCheck: "Sabır (Geduld) und Dua sind islamisch empfohlen. Kulturelle Praktiken respektvoll hinterfragen.",
    sourceIds: ["fiqh-janazah-basics"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-frauen-janazah",
    question: "Dürfen Frauen bei Janazah und am Friedhof teilnehmen?",
    islamicBasis:
      "Frauen dürfen am Janazah-Gebet und an der Beisetzung teilnehmen, nach den meisten Gelehrten.",
    culturalPractice:
      "In einigen Kulturen werden Frauen vom Friedhof ferngehalten.",
    whatToCheck: "Meinungsunterschiede beachten. Imam der lokalen Moschee fragen.",
    opinionDifferences: "Unterschiedliche Meinungen bei Friedhofsbesuch.",
    sourceIds: ["fiqh-janazah-basics"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-verstorbener-sehen",
    question: "Wer darf den Verstorbenen sehen?",
    islamicBasis:
      "Der Abschied ist grundsätzlich erlaubt, die Würde des Verstorbenen muss gewahrt bleiben.",
    culturalPractice:
      "In manchen Familien ist es üblich, dass nur bestimmte Personen den Verstorbenen sehen.",
    whatToCheck: "Eigene Wünsche dokumentieren. Schamgrenzen respektieren.",
    sourceIds: ["fiqh-ghusl-kafan"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-wer-wascht",
    question: "Wer darf den Verstorbenen waschen (Ghusl)?",
    islamicBasis:
      "Grundsätzlich gleichgeschlechtliche muslimische Personen. Ehepartner-Ausnahmen sind umstritten.",
    culturalPractice:
      "In der Praxis übernehmen oft Bestatter-Teams oder Moschee-Helfer.",
    whatToCheck: "Imam und Bestatter fragen. Wünsche vorher dokumentieren.",
    opinionDifferences: "Ehepartner beim Ghusl — unterschiedliche Meinungen.",
    sourceIds: ["fiqh-ghusl-kafan"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-grabschmuck",
    question: "Sind Grabschmuck, Fotos, Kerzen und Musik am Grab erlaubt?",
    islamicBasis:
      "Einfachheit bei der Beisetzung ist sunnah. Aufwendiger Grabschmuck und Musik sind nicht üblich im islamischen Bestattungsritus.",
    culturalPractice:
      "Blumen, Kerzen und Fotos sind in deutschen Friedhöfen häufig, aber nicht islamisch vorgeschrieben.",
    whatToCheck: "Friedhofsordnung und islamische Grundsätze abwägen.",
    sourceIds: ["fiqh-janazah-basics"],
    reviewStatus: "needs_scholar_review",
  },
  {
    id: "kultur-familie-belasten",
    question: "Darf die Familie finanziell belastet werden?",
    islamicBasis:
      "Der Verstorbene soll keine Schulden hinterlassen. Verschwendung (isrāf) ist verboten.",
    culturalPractice:
      "Teure Bestattungen und Feiern belasten Familien oft erheblich.",
    whatToCheck:
      "Einfache, würdevolle Bestattung planen. Sadaqa Jariya statt teurer kultureller Pflichten.",
    sourceIds: ["hadith-janazah-hasten"],
    reviewStatus: "needs_scholar_review",
  },
];
