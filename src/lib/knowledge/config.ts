export type RetrievalMode = "keyword" | "embedding" | "hybrid";
export type EmbeddingProviderName = "none" | "openai";

export function getRetrievalMode(): RetrievalMode {
  const v = (process.env.AMANAH_KNOWLEDGE_RETRIEVAL || "keyword").toLowerCase();
  if (v === "embedding" || v === "hybrid") return v;
  return "keyword";
}

export function getEmbeddingProviderName(): EmbeddingProviderName {
  const v = (process.env.AMANAH_EMBEDDING_PROVIDER || "none").toLowerCase();
  if (v === "openai" && process.env.OPENAI_API_KEY) return "openai";
  return "none";
}

export function getEmbeddingModel(): string {
  return process.env.AMANAH_EMBEDDING_MODEL || "text-embedding-3-small";
}

export const KNOWLEDGE_TOP_K = Number(process.env.AMANAH_KNOWLEDGE_TOP_K || "3");
export const KNOWLEDGE_MIN_SCORE = Number(process.env.AMANAH_KNOWLEDGE_MIN_SCORE || "2");

export const NO_SOURCE_MESSAGE =
  "Ich habe dazu in der geprüften Amanah-Wissensbasis noch keinen passenden Eintrag gefunden.";

export const ORIENTATION_NOTE = "Allgemeine Orientierung — keine Rechts-, Medizin- oder Fatwa-Beratung.";
