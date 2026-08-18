export function isInternalToolsEnabled(): boolean {
  return process.env.NODE_ENV === "development" || process.env.AMANAH_INTERNAL_TOOLS === "true";
}
