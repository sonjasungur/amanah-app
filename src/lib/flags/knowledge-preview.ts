/**
 * P2.7: the knowledge centre (entry page, six rubrics, full articles) is a preview of unpublished drafts.
 * It is reachable without signing in, but only where this switch is on: in local development or with
 * AMANAH_KNOWLEDGE_PREVIEW=true at runtime. Production never sets it, so there every page answers 404.
 * Staging passes it through (default off) and may switch it on only behind its password, by owner decision.
 * Publishing needs an explicit owner decision and its own change.
 */
export function isKnowledgePreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.AMANAH_KNOWLEDGE_PREVIEW === "true";
}
