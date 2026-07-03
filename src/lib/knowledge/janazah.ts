import type { KnowledgeArticle } from "@/lib/types";

export const janazahArticles: KnowledgeArticle[] = [
  {
    id: "janazah-what",
    slug: "was-ist-janazah",
    title: "Was ist Janazah?",
    summary: "Janazah bezeichnet die islamische Bestattungszeremonie für einen verstorbenen Muslim.",
    content:
      "Janazah umfasst die islamischen Rituale nach dem Tod: Ghusl (Totenwaschung), Kafan (Leichentuch), Janazah-Gebet (Salāt al-Janāzah) und Beisetzung. Es ist eine Amanah der Gemeinschaft, den Verstorbenen würdevoll zu begleiten.",
    sourceIds: ["fiqh-janazah-basics", "fiqh-ghusl-kafan"],
    reviewStatus: "needs_scholar_review",
    category: "janazah",
  },
  {
    id: "janazah-hasten",
    slug: "schnelle-bestattung",
    title: "Schnelle Bestattung — nicht unnötig verzögern",
    summary: "Die Janazah soll nicht ohne triftigen Grund verzögert werden.",
    content:
      "Im Islam wird empfohlen, die Bestattung nicht unnötig zu verzögern. Kulturelle Wartezeiten (7., 40., 52. Tag) sind nicht islamisch vorgeschrieben. Praktische und rechtliche Faktoren in Deutschland können eine Rolle spielen — mit Imam und Bestatter klären.",
    sourceIds: ["hadith-janazah-hasten"],
    reviewStatus: "needs_scholar_review",
    category: "janazah",
  },
  {
    id: "janazah-ghusl",
    slug: "ghusl",
    title: "Ghusl — Totenwaschung",
    summary: "Der Verstorbene wird nach islamischer Tradition gewaschen.",
    content:
      "Ghusl ist die rituelle Waschung des Verstorbenen. In der Regel übernehmen gleichgeschlechtliche muslimische Personen dies. Die Würde und Schamgrenzen des Verstorbenen sind zu wahren. Wer darf waschen, ist ein sensibles Thema mit Meinungsunterschieden.",
    sourceIds: ["fiqh-ghusl-kafan"],
    reviewStatus: "needs_scholar_review",
    category: "janazah",
  },
  {
    id: "janazah-kafan",
    slug: "kafan",
    title: "Kafan — Leichentuch",
    summary: "Der Verstorbene wird in weiße Tücher gehüllt.",
    content:
      "Kafan sind die weißen Leichentücher, in die der Verstorbene gehüllt wird. Die Anzahl und Art der Tücher kann je nach Meinung variieren. Der Bestatter oder die Moschee kann bei der Beschaffung helfen.",
    sourceIds: ["fiqh-ghusl-kafan"],
    reviewStatus: "needs_scholar_review",
    category: "janazah",
  },
  {
    id: "janazah-prayer",
    slug: "janazah-gebet",
    title: "Janazah-Gebet",
    summary: "Das gemeinschaftliche Totengebet ist ein wichtiger Teil der Janazah.",
    content:
      "Das Janazah-Gebet (Salāt al-Janāzah) ist ein gemeinschaftliches Gebet für den Verstorbenen. Es wird stehend verrichtet, ohne Ruku oder Sujud. Die Moschee oder der Imam organisiert dies in der Regel.",
    sourceIds: ["fiqh-janazah-basics"],
    reviewStatus: "needs_scholar_review",
    category: "janazah",
  },
  {
    id: "janazah-germany",
    slug: "deutschland-vs-ueberfuehrung",
    title: "Deutschland vs. Überführung",
    summary: "Beisetzung in Deutschland oder Überführung in die Heimat — beides erfordert Vorbereitung.",
    content:
      "Muslime in Deutschland können in Deutschland beerdigt oder in die Heimat überführt werden. Beides hat rechtliche, finanzielle und familiäre Aspekte. Eine rechtzeitige Dokumentation der Wünsche entlastet die Familie.",
    sourceIds: ["fiqh-janazah-basics"],
    reviewStatus: "reviewed",
    category: "janazah",
  },
];
