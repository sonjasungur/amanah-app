/** In-process counters for the memory server storage (development and tests). No dependencies. */
const windows = new Map<string, { count: number; windowStart: number }>();

export function memoryHit(key: string, windowMs: number, now = Date.now()): { count: number; windowStart: number } {
  const entry = windows.get(key);
  if (!entry || now - entry.windowStart >= windowMs) {
    const fresh = { count: 1, windowStart: now };
    windows.set(key, fresh);
    return fresh;
  }
  entry.count += 1;
  return entry;
}

export function memoryPeek(key: string, windowMs: number, now = Date.now()): number {
  const entry = windows.get(key);
  return entry && now - entry.windowStart < windowMs ? entry.count : 0;
}

export function memoryClear(key: string): void {
  windows.delete(key);
}

/** Clears all counters (tests only). */
export function resetMemoryAuthLimits(): void {
  windows.clear();
}
