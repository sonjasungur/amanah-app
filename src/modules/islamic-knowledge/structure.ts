import type { KnowledgeArea, KnowledgeAreaId } from "./types";

export const KNOWLEDGE_AREAS: KnowledgeArea[] = [
  {
    id: "faraid",
    letter: "A",
    title: "Islamisches Erbrecht (Farāʾiḍ)",
    description: "Erbanteile aus dem Qurʾān, Schulden, Waṣiyya und Unterschiede der Rechtsschulen.",
    legalReviewRequired: false,
    subtopics: [
      { id: "grundlagen", title: "Grundlagen des islamischen Erbrechts" },
      { id: "quran-4-11-12-176", title: "Qurʾān 4:11, 4:12 und 4:176" },
      { id: "ehepartner-kinder-eltern", title: "Rechte von Ehepartnern, Kindern und Eltern" },
      { id: "erbanteile", title: "Erbanteile und ihre Voraussetzungen" },
      { id: "schulden", title: "Schulden des Verstorbenen" },
      { id: "wasiyya-drittel", title: "Vermächtnisse und die Ein-Drittel-Regel" },
      { id: "rechte-der-erben", title: "Rechte der Erben" },
      { id: "missverstaendnisse", title: "Häufige Missverständnisse" },
      { id: "rechtsschulen", title: "Unterschiede zwischen Rechtsschulen" },
      { id: "rechenbeispiele", title: "Beispiele mit nachvollziehbaren Rechenschritten" },
    ],
  },
  {
    id: "tod-sterben",
    letter: "B",
    title: "Tod und Sterben im Islam",
    description: "Krankheit, Begleitung Sterbender, die Zeit nach dem Tod, Duʿāʾ, Trost.",
    legalReviewRequired: false,
    subtopics: [
      { id: "krankheit-sterben", title: "Umgang mit schwerer Krankheit und Sterben" },
      { id: "rechte-sterbender", title: "Rechte und Pflichten gegenüber Sterbenden" },
      { id: "nach-dem-tod", title: "Verhalten nach dem Eintritt des Todes" },
      { id: "dua", title: "Duʿāʾ und authentisch überlieferte Bittgebete" },
      { id: "trost-beileid", title: "Geduld, Trost und Beileid" },
      { id: "unbelegte-praktiken", title: "Verbreitete, aber nicht belegte Praktiken" },
    ],
  },
  {
    id: "janazah",
    letter: "C",
    title: "Janazah und islamische Bestattung",
    description: "Von Ghusl und Kafan bis zur Beisetzung — und was deutsches Bestattungsrecht dazu sagt.",
    legalReviewRequired: false,
    subtopics: [
      { id: "vorbereitung", title: "Vorbereitung der Bestattung" },
      { id: "ghusl", title: "Ghusl des Verstorbenen" },
      { id: "kafan", title: "Kafan" },
      { id: "salat-al-janazah", title: "Salāt al-Janāza" },
      { id: "beisetzung", title: "Beisetzung" },
      { id: "angehoerige", title: "Rechte und Pflichten der Angehörigen" },
      { id: "friedhofsbesuch", title: "Besuche auf dem Friedhof" },
      { id: "faq", title: "Häufige Fragen zur Bestattung" },
      { id: "bestattungsrecht", title: "Islamische Lehre und deutsches Bestattungsrecht" },
    ],
  },
  {
    id: "vorsorge",
    letter: "D",
    title: "Islamische Vorsorge",
    description: "Verantwortung für die Familie, Schulden, Waṣiyya, Sadaqa Jāriya, Kinder.",
    legalReviewRequired: false,
    subtopics: [
      { id: "verantwortung", title: "Verantwortung gegenüber Familie und Angehörigen" },
      { id: "schulden-dokumentieren", title: "Schulden und offene Verpflichtungen dokumentieren" },
      { id: "testament-wasiyya", title: "Testament und Waṣiyya" },
      { id: "wohltaetige-vermaechtnisse", title: "Wohltätige Vermächtnisse" },
      { id: "sadaqa-jariya", title: "Sadaqa Jāriya" },
      { id: "persoenliche-wuensche", title: "Persönliche Wünsche und ihre rechtliche Bedeutung" },
      { id: "minderjaehrige-kinder", title: "Vorsorge für minderjährige Kinder" },
    ],
  },
  {
    id: "islam-und-recht",
    letter: "E",
    title: "Islamische Lehre und deutsches Recht",
    description: "Wo sich islamisches und deutsches Erb- und Bestattungsrecht unterscheiden — und wann Anwalt oder Notar nötig sind.",
    legalReviewRequired: true,
    subtopics: [
      { id: "erbrecht-vergleich", title: "Islamisches und deutsches Erbrecht" },
      { id: "testierfreiheit", title: "Testierfreiheit" },
      { id: "pflichtteil", title: "Pflichtteile" },
      { id: "formvorschriften", title: "Formvorschriften für Testamente" },
      { id: "international", title: "Internationale Erbfälle" },
      { id: "bestattung-deutschland", title: "Islamische Bestattung in Deutschland" },
      { id: "anwalt-notar", title: "Wann anwaltlicher oder notarieller Rat erforderlich ist" },
    ],
  },
];

export function getKnowledgeArea(id: KnowledgeAreaId): KnowledgeArea {
  const area = KNOWLEDGE_AREAS.find((a) => a.id === id);
  if (!area) throw new Error(`Unknown knowledge area: ${id}`);
  return area;
}
