"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, Save } from "lucide-react";
import { useAmanahStore, cancelPendingSave } from "@/lib/store/use-amanah-store";
import { flushPendingSave } from "@/lib/storage/store-sync";
import { useActiveStorageLabel } from "@/lib/storage/use-storage-label";
import { useFieldCorrections } from "@/lib/store/field-corrections";
import { draftSummary, useGoToDraft } from "@/components/storage/date-drafts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

export type SaveBarState = "gespeichert" | "ungespeichert" | "fehlgeschlagen" | "teilweise" | "leer" | "korrektur";

/** Plain status for the folder: saved, unsaved changes, failed. Pure, so it can be tested. */
export function saveBarState(saveStatus: string, lastSaved: string | null, openCorrections = 0): SaveBarState {
  if (saveStatus === "error") return "fehlgeschlagen";
  // A field whose text cannot be stored (e.g. "31.02.1962") must not be reported as saved (P2.6, F1).
  if (openCorrections > 0) return "korrektur";
  if (saveStatus === "saving") return "ungespeichert";
  if (saveStatus === "partial") return "teilweise";
  if (saveStatus === "saved" || lastSaved) return "gespeichert";
  return "leer";
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

/**
 * The save area under every form: one clear "save to the folder" action next to the automatic
 * saving, the plain state and the time of the last confirmed save. Preview, PDF and print come
 * after it and separately (see DocumentPanel). Never shows success before the save is confirmed.
 */
export function SaveBar({ className, overviewHref = "/dashboard", compact = false }: { className?: string; overviewHref?: string; compact?: boolean }) {
  const saveStatus = useAmanahStore((s) => s.saveStatus);
  const lastSaved = useAmanahStore((s) => s.lastSaved);
  const saveError = useAmanahStore((s) => s.saveError);
  const location = useActiveStorageLabel();
  const corrections = useFieldCorrections((s) => s.open);
  const correctionIds = Object.keys(corrections);
  const [running, setRunning] = useState(false);
  const state = saveBarState(saveStatus, lastSaved, correctionIds.length);
  const goToDraft = useGoToDraft();
  const focusCorrection = () => {
    if (correctionIds[0]) goToDraft(correctionIds[0]);
  };

  const save = async (thenOverview: boolean) => {
    if (running) return;
    setRunning(true);
    try {
      cancelPendingSave();
      await flushPendingSave();
    } finally {
      setRunning(false);
    }
    // Everything else is saved; the open date is not, so the person is taken to it instead of away.
    const openKeys = Object.keys(useFieldCorrections.getState().open);
    if (openKeys.length) {
      goToDraft(openKeys[0]);
      return;
    }
    const after = useAmanahStore.getState().saveStatus;
    if (thenOverview && (after === "saved" || after === "partial" || after === "idle")) window.location.assign(overviewHref);
  };

  const where = location === "api" ? "in deinem Konto" : "in diesem Browser";
  const label: Record<SaveBarState, string> = {
    gespeichert: location === "api" ? "Gespeichert – sicher in deinem Vorsorgeordner" : "Gespeichert – in diesem Browser",
    ungespeichert: "Ungespeicherte Änderungen – werden gerade gespeichert",
    fehlgeschlagen: "Speicherung fehlgeschlagen",
    teilweise: "Teilweise gespeichert",
    leer: "Noch nichts gespeichert",
    korrektur: correctionIds.length === 1 ? "Ein Datum ist noch nicht gespeichert – bitte korrigieren" : `${correctionIds.length} Daten sind noch nicht gespeichert – bitte korrigieren`,
  };
  const warn = state === "fehlgeschlagen" || state === "korrektur";

  return (
    <section
      className={cn("no-print mt-6 rounded-2xl border-2 p-4 md:p-5", warn ? "border-destructive/40 bg-destructive/5" : "border-emerald/30 bg-accent-soft/60", className)}
      aria-label="Speichern"
      data-testid="save-bar"
      data-state={state}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div aria-live="polite" className="min-w-0">
          <p className={cn("flex items-center gap-2 font-semibold text-sm", warn ? "text-destructive" : "text-foreground")} data-testid="save-bar-status">
            {state === "gespeichert" && <Check size={16} className="text-emerald" aria-hidden />}
            {state === "ungespeichert" && <Loader2 size={16} className="animate-spin text-primary" aria-hidden />}
            {(warn || state === "teilweise") && <AlertCircle size={16} aria-hidden />}
            {label[state]}
          </p>
          <p className="text-xs text-muted mt-0.5" data-testid="save-bar-time">
            {lastSaved ? `Zuletzt gespeichert ${where}: ${fmt(lastSaved)}` : "Änderungen werden automatisch gespeichert."}
          </p>
          {state === "fehlgeschlagen" && saveError && <p className="text-xs text-destructive mt-1">{saveError}</p>}
          {state === "korrektur" && (
            <p className="text-sm text-destructive mt-1" data-testid="save-bar-correction">
              {draftSummary(Object.values(corrections)[0])}: {Object.values(corrections)[0].message}. Alles andere wird gespeichert.{" "}
              <button type="button" className="underline font-semibold" onClick={focusCorrection}>
                Zum Feld
              </button>
            </p>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button type="button" onClick={() => void save(false)} disabled={running} aria-busy={running} data-testid="save-bar-save">
            {running ? <Loader2 size={16} className="mr-2 animate-spin" aria-hidden /> : <Save size={16} className="mr-2" aria-hidden />}
            Im Vorsorgeordner speichern
          </Button>
          {!compact && (
            <Button type="button" variant="outline" onClick={() => void save(true)} disabled={running} data-testid="save-bar-save-overview">
              Speichern und zur Übersicht
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
