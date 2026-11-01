/**
 * The traffic light on the inheritance profile judges free text and family facts automatically.
 * It stays off until a lawyer has approved it (Doku 36, A9). Never default to on.
 */
export function isInheritanceHintsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_AMANAH_INHERITANCE_HINTS === "true";
}
