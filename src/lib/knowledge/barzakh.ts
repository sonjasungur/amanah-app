import type { KnowledgeArticle } from "@/lib/types";

export const barzakhArticles: KnowledgeArticle[] = [
  {
    id: "barzakh-what",
    slug: "was-ist-barzakh",
    title: "Was ist Barzakh?",
    summary: "Barzakh ist der Zwischenzustand nach dem Tod bis zur Auferstehung.",
    content:
      "Barzakh (بارزخ) bezeichnet die Phase zwischen dem Tod und dem Tag der Auferstehung. In dieser Zeit enden die weltlichen Taten — außer denen, die fortwirken. Allah entscheidet über das Schicksal jedes Menschen.",
    sourceIds: ["quran-barzakh"],
    reviewStatus: "needs_scholar_review",
    category: "barzakh",
  },
  {
    id: "barzakh-benefit",
    slug: "was-nutzt-dem-menschen",
    title: "Was kann dem Menschen nach dem Tod nutzen?",
    summary: "Fortlaufende gute Taten, Wissen und Dua rechtschaffener Kinder.",
    content:
      "Nach dem Tod können fortlaufende Sadaqa Jariya, nützliches Wissen und die Dua rechtschaffener Kinder dem Verstorbenen nutzen — so Allah es annimmt. Keine Garantie, aber bewusste Vorbereitung ist Amanah.",
    sourceIds: ["hadith-sadaqa-jariya"],
    reviewStatus: "needs_scholar_review",
    category: "barzakh",
  },
  {
    id: "barzakh-sadaqa",
    slug: "sadaqa-jariya-barzakh",
    title: "Sadaqa Jariya",
    summary: "Anhaltende Wohltätigkeit, die auch nach dem Tod fortwirkt.",
    content:
      "Sadaqa Jariya ist eine Wohltat, deren Nutzen über den Tod hinausreicht: Brunnen, Schulen, Wissen, Spenden für Bedürftige. Plane im zulässigen Rahmen deiner Waṣiyya (max. ein Drittel).",
    sourceIds: ["hadith-sadaqa-jariya", "hadith-wasiyyah-third"],
    reviewStatus: "needs_scholar_review",
    category: "barzakh",
  },
  {
    id: "barzakh-debts",
    slug: "schulden-amanah",
    title: "Schulden und Amanah",
    summary: "Offene Schulden und anvertraute Rechte sollten vor der Erbverteilung bedacht werden.",
    content:
      "Die genannten Erbanteile im Qur'an setzen Vermächtnisse und bestehende Schulden voraus. Amanah (anvertraute Güter) sollten zurückgegeben werden. Die Familie sollte eine Liste vorbereiten und fachlich (Anwalt/Imam) klären — keine pauschale Rangfolge ohne Beratung.",
    sourceIds: ["quran-nisa-4-11", "quran-nisa-4-12", "hadith-debts-deceased"],
    reviewStatus: "needs_scholar_review",
    category: "barzakh",
  },
  {
    id: "barzakh-forgiveness",
    slug: "vergebung-suchen",
    title: "Vergebung suchen und vergeben",
    summary: "Beziehungen klären, bevor es zu spät ist.",
    content:
      "Wer um Vergebung bitten möchte, sollte dies zu Lebzeiten tun. Eine Liste von Menschen, bei denen man um Vergebung bittet, entlastet die Familie und das Gewissen.",
    sourceIds: [],
    reviewStatus: "reviewed",
    category: "barzakh",
  },
  {
    id: "barzakh-family",
    slug: "was-angehoerige-tun",
    title: "Was Angehörige tun können",
    summary: "Dua, Sadaqa Jariya, Schulden begleichen — ohne übertriebene Praktiken.",
    content:
      "Angehörige können Dua machen, Sadaqa spenden, Schulden begleichen und Amanah erfüllen. Vermeide kulturelle Praktiken ohne islamische Grundlage. Allah entscheidet.",
    sourceIds: ["hadith-sadaqa-jariya"],
    reviewStatus: "reviewed",
    category: "barzakh",
  },
];
