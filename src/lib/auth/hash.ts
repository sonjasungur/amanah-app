/** Simple deterministic hash for mock/demo auth — not for production passwords. */
export async function hashPassword(password: string): Promise<string> {
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const data = new TextEncoder().encode(`amanah-demo:${password}`);
    const digest = await crypto.subtle.digest("SHA-256", data);
    return Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
  return `demo-${password.length}-${password.slice(0, 3)}`;
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}

/** Sync fallback for tests */
export function hashPasswordSync(password: string): string {
  return `demo-${password.length}-${password.slice(0, 3)}`;
}
