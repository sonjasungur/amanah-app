import type { AiFeature, AiProviderName } from "./types";

const hits = new Map<string, { count: number; resetAt: number }>();
const MAX = 30;
const WINDOW_MS = 60_000;

export function checkRateLimit(key: string, max = MAX): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= max) {
    return { allowed: false, retryAfterMs: entry.resetAt - now };
  }
  entry.count++;
  return { allowed: true };
}

/** Clears all counters (tests only). */
export function resetRateLimits(): void {
  hits.clear();
}

const eventLog: { feature: AiFeature; provider: AiProviderName; createdAt: string; success: boolean; error?: string }[] = [];

export function logAiEvent(
  feature: AiFeature,
  provider: AiProviderName,
  success: boolean,
  error?: string
): void {
  eventLog.push({ feature, provider, createdAt: new Date().toISOString(), success, error: error?.slice(0, 100) });
  if (eventLog.length > 200) eventLog.shift();
}

export function getRecentAiEvents() {
  return [...eventLog].slice(-20);
}
