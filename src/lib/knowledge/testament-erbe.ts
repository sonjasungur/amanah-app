import type { KnowledgeArticle } from "@/lib/types";

export const testamentArticles: KnowledgeArticle[] = [
  {
    id: "erbe-amanah",
    slug: "erbe-ist-amanah",
    title: "Erbe ist Amanah",
    summary: "Im Islam ist das Erbe eine Vertrauenspflicht — nicht nur ein persönlicher Wunsch.",
    content:
      "Dein Vermögen ist Amanah. Allah hat feste Erbanteile (Farāʾiḍ) für Angehörige bestimmt. Du kannst bis zu einem Drittel frei verfügen (Waṣiyya), aber nicht die Rechte der Pflicht-Erben aushebeln.",
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12", "hadith-wasiyyah-third"],
    reviewStatus: "needs_scholar_review",
    category: "testament",
  },
  {
    id: "erbe-faraid",
    slug: "fara-id",
    title: "Farāʾiḍ — feste Erbanteile",
    summary: "Allah hat Erbanteile für Söhne, Töchter, Eltern und Ehepartner festgelegt.",
    content:
      "Die festen Erbanteile sind im Quran genannt. Söhne erhalten doppelt so viel wie Töchter (in bestimmten Konstellationen). Ehepartner, Eltern und Kinder haben festgelegte Anteile. Stiefkinder und Pflegekinder sind nicht automatisch Pflicht-Erben.",
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12", "quran-nisa-4-176"],
    reviewStatus: "needs_scholar_review",
    category: "testament",
  },
  {
    id: "erbe-wasiyyah",
    slug: "wasiyyah",
    title: "Waṣiyya — frei verfügbar bis maximal ein Drittel",
    summary: "Der frei verfügbare Teil des Nachlasses ist klassisch auf ein Drittel begrenzt.",
    content:
      "Mit der Waṣiyya kannst du bis zu einem Drittel deines Nachlasses für Nicht-Pflicht-Erben, Sadaqa Jariya oder andere Zwecke bestimmen. Mehr als ein Drittel erfordert die Zustimmung der Erben. Pflicht-Erben können nicht vollständig ausgeschlossen werden.",
    sourceIds: ["hadith-wasiyyah-third", "quran-nisa-4-11"],
    reviewStatus: "needs_scholar_review",
    category: "testament",
  },
  {
    id: "erbe-deutschland",
    slug: "deutsches-recht",
    title: "Deutsches Erbrecht beachten",
    summary: "Islamisches Erbrecht und deutsches Erbrecht müssen zusammen gedacht werden.",
    content:
      "In Deutschland gelten Formvorschriften (notarielles Testament), Pflichtteilsrechte und gesetzliche Erbfolge. Ein islamisches Erbkonzept braucht die Prüfung durch Imam/Gelehrte UND Anwalt/Notar.",
    sourceIds: ["official-vorsorgevollmacht"],
    reviewStatus: "reviewed",
    category: "testament",
  },
];
