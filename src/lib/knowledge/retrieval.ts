import type { KnowledgeEntry, KnowledgeLanguage, KnowledgeSearchResult } from "./types";
import { KNOWLEDGE_TOP_K } from "./config";
import { getAllEntries, getProductionEntries } from "./entries";
import { keywordSearchOrFallback } from "./search";
import { getRetrievalMode, getEmbeddingProviderName } from "./config";

export interface EmbeddingProvider {
  readonly name: string;
  embed(texts: string[]): Promise<number[][]>;
}

class NoopEmbeddingProvider implements EmbeddingProvider {
  readonly name = "none";
  async embed(texts: string[]): Promise<number[][]> {
    void texts;
    return [];
  }
}

class OpenAIEmbeddingProvider implements EmbeddingProvider {
  readonly name = "openai";
  async embed(texts: string[]): Promise<number[][]> {
    const key = process.env.OPENAI_API_KEY;
    if (!key) return [];
    try {
      const model = process.env.AMANAH_EMBEDDING_MODEL || "text-embedding-3-small";
      const res = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ model, input: texts }),
      });
      if (!res.ok) return [];
      const data = await res.json();
      return (data.data as { embedding: number[] }[]).map((d) => d.embedding);
    } catch {
      return [];
    }
  }
}

let embeddingProvider: EmbeddingProvider | null = null;

export function getEmbeddingProvider(): EmbeddingProvider {
  if (embeddingProvider) return embeddingProvider;
  embeddingProvider =
    getEmbeddingProviderName() === "openai" ? new OpenAIEmbeddingProvider() : new NoopEmbeddingProvider();
  return embeddingProvider;
}

export function resetEmbeddingProvider(): void {
  embeddingProvider = null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return dot / (Math.sqrt(na) * Math.sqrt(nb) || 1);
}

async function embeddingSearch(
  query: string,
  entries: KnowledgeEntry[],
  topK: number
): Promise<KnowledgeSearchResult[]> {
  const provider = getEmbeddingProvider();
  if (provider.name === "none") return [];

  const texts = [query, ...entries.map((e) => `${e.title}. ${e.summary}. ${e.content.slice(0, 400)}`)];
  const vectors = await provider.embed(texts);
  if (vectors.length < 2) return [];

  const queryVec = vectors[0];
  return entries
    .map((entry, i) => ({
      entry,
      score: cosineSimilarity(queryVec, vectors[i + 1]) * 10,
    }))
    .filter((r) => r.score > 0.5)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}

export async function retrieveKnowledge(
  query: string,
  options?: { language?: KnowledgeLanguage; productionOnly?: boolean; topK?: number }
): Promise<KnowledgeSearchResult[]> {
  const language = options?.language ?? "de";
  const topK = options?.topK ?? KNOWLEDGE_TOP_K;
  const entries = options?.productionOnly !== false ? getProductionEntries() : getAllEntries();
  const mode = getRetrievalMode();

  const keywordResults = keywordSearchOrFallback(query, entries, { language, topK });

  if (mode === "keyword" || getEmbeddingProvider().name === "none") {
    return keywordResults;
  }

  const embedResults = await embeddingSearch(query, entries, topK);
  if (mode === "embedding") return embedResults.length ? embedResults : keywordResults;

  const merged = new Map<string, KnowledgeSearchResult>();
  for (const r of [...keywordResults, ...embedResults]) {
    const prev = merged.get(r.entry.id);
    merged.set(r.entry.id, prev ? { entry: r.entry, score: prev.score + r.score } : r);
  }
  return [...merged.values()].sort((a, b) => b.score - a.score).slice(0, topK);
}

export function retrieveKnowledgeSync(
  query: string,
  options?: { language?: KnowledgeLanguage; productionOnly?: boolean; topK?: number }
): KnowledgeSearchResult[] {
  const language = options?.language ?? "de";
  const topK = options?.topK ?? KNOWLEDGE_TOP_K;
  const entries = options?.productionOnly !== false ? getProductionEntries() : getAllEntries();
  return keywordSearchOrFallback(query, entries, { language, topK });
}
