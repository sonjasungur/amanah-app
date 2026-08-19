const FORBIDDEN_FALLBACKS = new Set(["dort", "there", "hier"]);

export function getDisplayName(name?: string | null): string {
  const trimmed = (name ?? "").trim();
  if (!trimmed) return "";
  if (FORBIDDEN_FALLBACKS.has(trimmed.toLowerCase())) return "";
  return trimmed;
}

export function getDashboardGreeting(name?: string | null): string {
  const displayName = getDisplayName(name);
  if (!displayName) return "Willkommen bei Mein Wille";
  return `Willkommen, ${displayName}`;
}
