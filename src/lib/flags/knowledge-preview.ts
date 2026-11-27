/**
 * P2.7: the knowledge centre (entry page, six rubrics, full articles) is a preview of unpublished drafts.
 * It is reachable without signing in, but only where this switch is on: in local development or with
 * AMANAH_KNOWLEDGE_PREVIEW=true at runtime. Production must never set it (refused by the deploy check), so there every page answers 404.
 * Staging passes it through (default off) and may switch it on only behind its password, by owner decision.
 * Publishing needs an explicit owner decision and its own change.
 */
export function isKnowledgePreviewEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.AMANAH_KNOWLEDGE_PREVIEW === "true";
}

/**
 * Editorial review pages (/wissen/redaktion: every draft with its review status). Open with the internal tools or,
 * on password-protected staging, with the knowledge preview, so the owner can review all articles (owner order
 * 26.11.2026). The deploy check (scripts/validate-production-env.mjs, run by deploy-preflight.sh; mirrored in
 * src/lib/server/production-config.ts) refuses both switches for production, and docker-compose.prod.yml does not
 * pass them through. These pages do not check the environment themselves at runtime.
 */
export function isEditorialPreviewEnabled(): boolean {
  return isKnowledgePreviewEnabled() || process.env.AMANAH_INTERNAL_TOOLS === "true";
}
