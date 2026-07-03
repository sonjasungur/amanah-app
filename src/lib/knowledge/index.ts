import { janazahArticles } from "./janazah";
import { barzakhArticles } from "./barzakh";
import { testamentArticles } from "./testament-erbe";
import { patientenverfuegungArticles } from "./patientenverfuegung";
import { sadaqaJariyaArticles } from "./sadaqa-jariya";
import { ghuslKafanArticles } from "./ghusl-kafan";
import type { KnowledgeArticle } from "@/lib/types";

export { islamicSources, getSourcesByIds } from "./sources";
export { janazahArticles } from "./janazah";
export { cultureFilterCards } from "./kulturfilter";
export { barzakhArticles } from "./barzakh";
export { testamentArticles } from "./testament-erbe";
export { patientenverfuegungArticles } from "./patientenverfuegung";
export { sadaqaJariyaArticles } from "./sadaqa-jariya";
export { ghuslKafanArticles } from "./ghusl-kafan";

const allArticles: KnowledgeArticle[] = [
  ...janazahArticles,
  ...barzakhArticles,
  ...testamentArticles,
  ...patientenverfuegungArticles,
  ...sadaqaJariyaArticles,
  ...ghuslKafanArticles,
];

export function getAllPublishedArticles(): KnowledgeArticle[] {
  return allArticles.filter((a) => a.reviewStatus !== "draft");
}

export function searchKnowledge(query: string): KnowledgeArticle[] {
  const q = query.toLowerCase();
  return getAllPublishedArticles().filter(
    (a) =>
      a.title.toLowerCase().includes(q) ||
      a.content.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q)
  );
}
