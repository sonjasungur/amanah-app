import type { KnowledgeEntry, KnowledgeLanguage, KnowledgeSearchResult } from "./types";
import { KNOWLEDGE_MIN_SCORE } from "./config";

const WEIGHTS = {
  title: 10,
  tags: 8,
  category: 6,
  summary: 4,
  content: 2,
};

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1);
}

function tokenMatches(queryToken: string, fieldToken: string): boolean {
  if (queryToken === fieldToken) return true;
  const minLen = 4;
  if (queryToken.length >= minLen && fieldToken.includes(queryToken)) return true;
  if (fieldToken.length >= minLen && queryToken.includes(fieldToken)) return true;
  return false;
}

function scoreEntry(entry: KnowledgeEntry, tokens: string[]): number {
  if (tokens.length === 0) return 0;
  let score = 0;
  const titleTokens = tokenize(entry.title);
  const tagTokens = entry.tags.flatMap((t) => tokenize(t));
  const categoryTokens = tokenize(entry.category.replace(/-/g, " "));
  const summaryTokens = tokenize(entry.summary);
  const contentTokens = tokenize(entry.content);

  for (const token of tokens) {
    if (token.length < 3) continue;
    if (titleTokens.some((t) => tokenMatches(token, t))) score += WEIGHTS.title;
    if (tagTokens.some((t) => tokenMatches(token, t))) score += WEIGHTS.tags;
    if (categoryTokens.some((t) => tokenMatches(token, t))) score += WEIGHTS.category;
    if (summaryTokens.some((t) => tokenMatches(token, t))) score += WEIGHTS.summary;
    if (contentTokens.some((t) => tokenMatches(token, t))) score += WEIGHTS.content;
    if (entry.title.toLowerCase().includes(token)) score += WEIGHTS.title;
    if (entry.summary.toLowerCase().includes(token)) score += WEIGHTS.summary;
  }
  return score;
}

export function keywordSearch(
  query: string,
  entries: KnowledgeEntry[],
  options?: { language?: KnowledgeLanguage; topK?: number; minScore?: number }
): KnowledgeSearchResult[] {
  const tokens = tokenize(query);
  const language = options?.language ?? "de";
  const topK = options?.topK ?? 3;
  const minScore = options?.minScore ?? KNOWLEDGE_MIN_SCORE;

  const results = entries
    .filter((e) => e.language === language)
    .map((entry) => ({ entry, score: scoreEntry(entry, tokens) }))
    .filter((r) => r.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);

  return results;
}

export function keywordSearchOrFallback(
  query: string,
  entries: KnowledgeEntry[],
  options?: { language?: KnowledgeLanguage; topK?: number }
): KnowledgeSearchResult[] {
  const results = keywordSearch(query, entries, options);
  if (results.length > 0) return results;

  const q = query.toLowerCase();
  const loose = entries
    .filter((e) => e.language === (options?.language ?? "de"))
    .filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.summary.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q))
    )
    .slice(0, options?.topK ?? 3)
    .map((entry, i) => ({ entry, score: 3 - i }));

  return loose;
}
