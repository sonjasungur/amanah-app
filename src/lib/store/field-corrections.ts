import { create } from "zustand";

/**
 * Fields whose typed text is not stored because it is no valid value (P2.6, F1: an unfinished or
 * impossible birth date). The folder keeps its last valid value; the save bar names the open
 * correction instead of reporting everything as saved. Keyed by the field's id.
 */
type FieldCorrections = {
  open: Record<string, string>;
  report: (id: string, message: string | null) => void;
};

export const useFieldCorrections = create<FieldCorrections>((set) => ({
  open: {},
  report: (id, message) =>
    set((s) => {
      if ((s.open[id] ?? null) === message) return s;
      const open = { ...s.open };
      if (message) open[id] = message;
      else delete open[id];
      return { open };
    }),
}));
