import type { KnowledgeEntry, KnowledgeCitation, PublicKnowledgeEntry, PublicKnowledgeEntryDetail } from "./types";
import { ORIENTATION_NOTE } from "./config";
import { reviewBadge } from "./safety";

export function toCitation(entry: KnowledgeEntry): KnowledgeCitation {
  return {
    entryId: entry.id,
    title: entry.title,
    category: entry.category,
    sourceLabel: entry.sourceLabel,
    sourceUrl: entry.sourceUrl,
    reviewedStatus: entry.reviewedStatus,
    orientationNote: ORIENTATION_NOTE,
  };
}

export function formatCitationsForText(citations: KnowledgeCitation[]): string[] {
  return citations.map(
    (c) => `${c.title} (${c.category}) — ${c.sourceLabel}${c.sourceUrl ? ` · ${c.sourceUrl}` : ""}`
  );
}

export function toPublicEntry(entry: KnowledgeEntry): PublicKnowledgeEntry {
  return {
    id: entry.id,
    title: entry.title,
    category: entry.category,
    language: entry.language,
    summary: entry.summary,
    sourceLabel: entry.sourceLabel,
    sourceUrl: entry.sourceUrl,
    reviewedStatus: entry.reviewedStatus,
    riskLevel: entry.riskLevel,
    tags: entry.tags,
    lastReviewedAt: entry.lastReviewedAt,
    reviewBadge: reviewBadge(entry),
  };
}

export function toPublicEntryDetail(entry: KnowledgeEntry): PublicKnowledgeEntryDetail {
  return {
    ...toPublicEntry(entry),
    content: entry.content,
  };
}
