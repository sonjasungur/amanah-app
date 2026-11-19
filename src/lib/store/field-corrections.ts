import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * Open date drafts (P2.6, owner acceptance): text typed into a date field that is no valid date yet
 * ("03.07.", "31.02.1962"). The folder keeps its last valid value, but the draft stays the person's
 * current input: it stays visible in the field, also after leaving the page and coming back, until it is
 * corrected or explicitly discarded. While a draft is open, previews show no old date and exports are
 * blocked (see withDateDrafts and DocumentPanel).
 *
 * Kept per tab in sessionStorage, so a reload (or a phone dropping the tab) does not lose it silently.
 * Cleared on sign-out (clearDateDrafts).
 */
export type DateDraft = {
  /** What the person typed, e.g. "03.07.". */
  text: string;
  /** The hint shown at the field, e.g. "Geburtsdatum noch unvollständig". */
  message: string;
  /** Field name for notices, e.g. "Geburtsdatum". */
  label: string;
  /** Where the value lives in the folder, e.g. "emergencyCard.birthDate"; empty for fields outside it. */
  path: string;
  /** Page of the field, to bring the person back to it. */
  href: string;
};

type FieldCorrections = {
  open: Record<string, DateDraft>;
  /** Raised when a draft is discarded from outside the field, so a mounted field shows the stored value again. */
  discarded: Record<string, number>;
  /** A field to focus when it mounts next (after "Zum Feld" from another page). */
  focusKey: string | null;
  report: (key: string, draft: DateDraft | null) => void;
  discard: (key: string) => void;
  requestFocus: (key: string | null) => void;
};

const sameDraft = (a: DateDraft | undefined, b: DateDraft | null) =>
  (!a && !b) || (!!a && !!b && a.text === b.text && a.message === b.message && a.label === b.label && a.path === b.path && a.href === b.href);

export const useFieldCorrections = create<FieldCorrections>()(
  persist(
    (set) => ({
      open: {},
      discarded: {},
      focusKey: null,
      report: (key, draft) =>
        set((s) => {
          if (sameDraft(s.open[key], draft)) return s;
          const open = { ...s.open };
          if (draft) open[key] = draft;
          else delete open[key];
          return { open };
        }),
      discard: (key) =>
        set((s) => {
          const open = { ...s.open };
          delete open[key];
          return { open, discarded: { ...s.discarded, [key]: (s.discarded[key] ?? 0) + 1 } };
        }),
      requestFocus: (key) => set({ focusKey: key }),
    }),
    {
      name: "amanah-date-drafts",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({ open: s.open }),
    },
  ),
);

export function clearDateDrafts() {
  useFieldCorrections.setState({ open: {}, focusKey: null });
  try {
    sessionStorage.removeItem("amanah-date-drafts");
  } catch {
    /* storage unavailable: nothing kept */
  }
}

/**
 * The folder as documents should see it while drafts are open: the draft replaces the stored value, so
 * the document check names it ("Bitte prüfen") and prints no old date. Pure, so it can be tested.
 */
export function withDateDrafts<T extends object>(data: T, drafts: Record<string, DateDraft>): T {
  const entries = Object.values(drafts).filter((d) => d.path.includes("."));
  if (!entries.length) return data;
  const out = { ...data } as Record<string, unknown>;
  for (const d of entries) {
    const [section, key] = d.path.split(".", 2);
    const current = out[section];
    if (current && typeof current === "object") out[section] = { ...(current as Record<string, unknown>), [key]: d.text };
  }
  return out as T;
}
