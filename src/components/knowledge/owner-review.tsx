"use client";

import { useEffect, useState } from "react";

/**
 * The owner's own check of each source in the internal review area (P2.6). Kept only in this browser
 * (localStorage) and exportable as a file, so nothing is stored on the server and no migration is
 * needed. It is a personal reading check, never a scholarly or legal release.
 */
const STORAGE_ITEM = "amanah-redaktion-pruefung-v1";

type ReviewState = Record<string, { checkedAt: string; note?: string }>;

function read(): ReviewState {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_ITEM) ?? "{}") as ReviewState;
  } catch {
    return {};
  }
}

function write(state: ReviewState) {
  try {
    localStorage.setItem(STORAGE_ITEM, JSON.stringify(state));
  } catch {
    /* private mode: the check works for this visit only */
  }
  window.dispatchEvent(new Event("amanah-review-change"));
}

function useReview(): [ReviewState, (next: ReviewState) => void] {
  const [state, setState] = useState<ReviewState>({});
  useEffect(() => {
    const load = () => setState(read());
    load();
    window.addEventListener("amanah-review-change", load);
    return () => window.removeEventListener("amanah-review-change", load);
  }, []);
  return [state, (next) => write(next)];
}

export function OwnerSourceCheck({ articleId, sourceRef }: { articleId: string; sourceRef: string }) {
  const [state, save] = useReview();
  const key = `${articleId}#${sourceRef}`;
  const entry = state[key];
  return (
    <label className="inline-flex items-center gap-2 text-xs min-h-[36px] print:hidden" data-testid="owner-check">
      <input
        type="checkbox"
        className="h-4 w-4"
        checked={Boolean(entry)}
        onChange={(e) => {
          const next = { ...read() };
          if (e.target.checked) next[key] = { checkedAt: new Date().toISOString() };
          else delete next[key];
          save(next);
        }}
      />
      {entry ? `Von mir geprüft am ${new Date(entry.checkedAt).toLocaleDateString("de-DE")}` : "Von mir geprüft"}
    </label>
  );
}

export function OwnerReviewSummary({ articleId, refs }: { articleId: string; refs: string[] }) {
  const [state] = useReview();
  const done = refs.filter((r) => state[`${articleId}#${r}`]).length;
  return (
    <span data-testid="owner-review-summary">
      Von der Betreiberin geprüft: {done} von {refs.length} Quellen (in diesem Browser)
    </span>
  );
}

/** Downloads the owner's checks as a file, to be handed over and recorded in the repository. */
export function OwnerReviewExport() {
  const [state] = useReview();
  const count = Object.keys(state).length;
  const download = () => {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), checks: state }, null, 1)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `amanah-quellenpruefung-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <button type="button" onClick={download} className="rounded-lg border border-border px-3 py-2 text-sm min-h-[44px] print:hidden" data-testid="owner-review-export">
      Meine Prüfung exportieren ({count} Quellen)
    </button>
  );
}
