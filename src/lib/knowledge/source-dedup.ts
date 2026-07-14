import type { IslamicSource } from "@/lib/types";

/** Normalize text for duplicate hadith detection */
export function normalizeSourceContent(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Deduplicate primary sources by sourceGroup or normalized translation */
export function dedupePrimarySources(sources: IslamicSource[]): IslamicSource[] {
  const seenGroups = new Set<string>();
  const seenContent = new Set<string>();
  const result: IslamicSource[] = [];

  for (const source of sources) {
    if (source.sourceGroup) {
      if (seenGroups.has(source.sourceGroup)) continue;
      seenGroups.add(source.sourceGroup);
      result.push(source);
      continue;
    }

    const contentKey = source.translationDe
      ? normalizeSourceContent(source.translationDe)
      : source.id;
    if (seenContent.has(contentKey)) continue;
    seenContent.add(contentKey);
    result.push(source);
  }

  return result;
}

/** Merge cross-collection references for grouped sources */
export function groupedReferenceLabel(sources: IslamicSource[]): string | null {
  const group = sources.find((s) => s.sourceGroup)?.sourceGroup;
  if (!group) return null;

  const inGroup = sources.filter((s) => s.sourceGroup === group);
  if (inGroup.length <= 1) return null;

  const refs = inGroup.map((s) => s.reference).join(" · ");
  return refs;
}
