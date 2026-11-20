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

const EXPORT_FORMAT = "amanah-quellenpruefung";

/**
 * Reads an exported file back. Accepts this format (version 1) and the first export without a format
 * field. Every entry needs a key "article#ref" and an ISO date; anything else is skipped and counted.
 * Merging never deletes: an entry already in the browser stays, and for the same source the later
 * date wins. `knownKeys`, if given, flags entries whose source no longer exists (kept, but reported).
 */
export function parseReviewExport(
  text: string,
  current: ReviewState,
  knownKeys?: Set<string>,
): { ok: true; merged: ReviewState; added: number; updated: number; skipped: number; unknown: number } | { ok: false; error: string } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: "Die Datei ist kein gültiges JSON." };
  }
  const obj = data as { format?: unknown; version?: unknown; checks?: unknown };
  if (!obj || typeof obj !== "object" || !obj.checks || typeof obj.checks !== "object") {
    return { ok: false, error: "Die Datei enthält keinen Prüfstand (Feld „checks“ fehlt)." };
  }
  if (obj.format !== undefined && obj.format !== EXPORT_FORMAT) return { ok: false, error: "Die Datei stammt nicht aus der Amanah-Quellenprüfung." };
  if (obj.version !== undefined && obj.version !== 1) return { ok: false, error: `Unbekannte Version ${String(obj.version)}.` };
  const merged: ReviewState = { ...current };
  let added = 0;
  let updated = 0;
  let skipped = 0;
  let unknown = 0;
  for (const [key, value] of Object.entries(obj.checks as Record<string, unknown>)) {
    const v = value as { checkedAt?: unknown; note?: unknown };
    const valid = /^[^#\s]+#[^#\s]+$/.test(key) && v && typeof v.checkedAt === "string" && !Number.isNaN(Date.parse(v.checkedAt));
    if (!valid) {
      skipped += 1;
      continue;
    }
    if (knownKeys && !knownKeys.has(key)) unknown += 1;
    const entry = { checkedAt: v.checkedAt as string, ...(typeof v.note === "string" ? { note: v.note } : {}) };
    const have = merged[key];
    if (!have) {
      merged[key] = entry;
      added += 1;
    } else if (Date.parse(entry.checkedAt) > Date.parse(have.checkedAt)) {
      merged[key] = entry;
      updated += 1;
    }
  }
  return { ok: true, merged, added, updated, skipped, unknown };
}

/** Downloads the owner's checks as a file, to be handed over and recorded in the repository. */
export function OwnerReviewExport() {
  const [state] = useReview();
  const count = Object.keys(state).length;
  const download = () => {
    const payload = { format: EXPORT_FORMAT, version: 1, exportedAt: new Date().toISOString(), count, checks: state };
    const blob = new Blob([JSON.stringify(payload, null, 1)], { type: "application/json" });
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

/** Loads an exported file back into this browser (e.g. after clearing data or on another device). */
export function OwnerReviewImport({ knownKeys }: { knownKeys: string[] }) {
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const onFile = async (file: File | undefined) => {
    if (!file) return;
    const result = parseReviewExport(await file.text(), read(), new Set(knownKeys));
    if (!result.ok) {
      setMessage({ ok: false, text: `Nicht importiert: ${result.error}` });
      return;
    }
    write(result.merged);
    const parts = [`${result.added} neu`, `${result.updated} aktualisiert`];
    if (result.skipped) parts.push(`${result.skipped} ungültige Einträge übersprungen`);
    if (result.unknown) parts.push(`${result.unknown} zu Quellen, die es nicht mehr gibt (behalten)`);
    setMessage({ ok: true, text: `Importiert: ${parts.join(", ")}. Nichts wurde gelöscht.` });
  };
  return (
    <div className="print:hidden">
      <label className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm min-h-[44px] cursor-pointer">
        Prüfung aus Datei laden
        <input
          type="file"
          accept="application/json,.json"
          className="sr-only"
          data-testid="owner-review-import"
          onChange={(e) => {
            void onFile(e.target.files?.[0]);
            e.target.value = "";
          }}
        />
      </label>
      {message && (
        <p role="status" className={`mt-2 text-sm ${message.ok ? "" : "text-danger"}`} data-testid="owner-review-import-result">
          {message.text}
        </p>
      )}
    </div>
  );
}
