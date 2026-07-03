import type { KnowledgeArticle } from "@/lib/types";

export const sadaqaJariyaArticles: KnowledgeArticle[] = [
  {
    id: "sj-what",
    slug: "was-ist-sadaqa-jariya",
    title: "Was ist Sadaqa Jariya?",
    summary: "Anhaltende Wohltätigkeit, deren Nutzen über den Tod hinausreicht.",
    content:
      "Sadaqa Jariya (fortlaufende Wohltat) ist eine Spende oder ein Projekt, das auch nach deinem Tod Menschen nützt: Brunnen, Schulen, Moscheen, medizinische Hilfe, verbreitetes Wissen.",
    sourceIds: ["hadith-sadaqa-jariya"],
    reviewStatus: "needs_scholar_review",
    category: "sadaqa-jariya",
  },
  {
    id: "sj-examples",
    slug: "beispiele",
    title: "Was kann weiter Nutzen bringen?",
    summary: "Wasser, Bildung, Wissen, Hilfsmittel, Gemeinde, nachhaltige Hilfe.",
    content:
      "Beispiele: Brunnen bauen, Schulbücher spenden, Quran-Unterricht ermöglichen, medizinische Geräte finanzieren, Waisen unterstützen, Infrastruktur für Gemeinden schaffen.",
    sourceIds: ["hadith-sadaqa-jariya"],
    reviewStatus: "needs_scholar_review",
    category: "sadaqa-jariya",
  },
  {
    id: "sj-foerderkreis",
    slug: "foerderkreis",
    title: "Förderkreis-Gedanke",
    summary: "Regelmäßige Sadaqa Jariya als Vorsorge für den Barzakh.",
    content:
      "Ein Förderkreis ermöglicht regelmäßige Sadaqa Jariya — zu Lebzeiten und als Plan für nach dem Tod. Gemeinsam1 e.V. bietet strukturierte Projekte. Spenden laufen direkt über den Verein.",
    sourceIds: ["hadith-sadaqa-jariya", "hadith-wasiyyah-third"],
    reviewStatus: "reviewed",
    category: "sadaqa-jariya",
  },
];
