"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { useActiveStorageLabel } from "@/lib/storage/use-storage-label";
import { useI18n } from "@/lib/i18n/context";
import { flushPendingSave } from "@/lib/storage/store-sync";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

/**
 * The one save status of a page. `compact` keeps it to a single line (status and time); problems
 * (error, partial, near the limit) always show their full explanation. `fallback` is shown while
 * nothing has been changed yet, so the place of storage is never left unsaid.
 */
export function SaveStatusIndicator({ className, compact, fallback }: { className?: string; compact?: boolean; fallback?: string }) {
  const saveStatus = useAmanahStore((s) => s.saveStatus);
  const saveError = useAmanahStore((s) => s.saveError);
  const lastSaved = useAmanahStore((s) => s.lastSaved);
  const nearLimit = useAmanahStore((s) => s.saveNearLimit);
  const folderProblem = useAmanahStore((s) => s.folderProblem);
  const { t } = useI18n();
  const storageLabel = useActiveStorageLabel();

  const statusLabel =
    saveStatus === "saved"
      ? storageLabel === "api"
        ? t("storage.status.savedAccount")
        : t("storage.status.savedLocal")
      : saveStatus === "saving"
        ? t("storage.status.saving")
        : saveStatus === "error"
          ? t("storage.status.error")
          : saveStatus === "partial"
            ? t("storage.status.partial")
            : null;

  const locationHint =
    saveStatus === "saved"
      ? storageLabel === "api"
        ? t("storage.location.api")
        : t("storage.location.local")
      : null;

  if (folderProblem) return null;
  if (!statusLabel && saveStatus === "idle") {
    return fallback ? (
      <p className={cn("flex items-center gap-2 text-xs font-medium text-green-700", className)} data-testid="save-status-indicator">
        <Check size={14} aria-hidden />
        <span>{fallback}</span>
      </p>
    ) : null;
  }
  const savedAt = saveStatus === "saved" && lastSaved ? new Date(lastSaved).toLocaleString() : null;

  return (
    <div className={cn("flex flex-col gap-1", className)} data-testid="save-status-indicator" aria-live="polite">
      {statusLabel && (
        <div
          className={cn(
            "flex items-center gap-2 text-xs font-medium",
            saveStatus === "saved" && "text-green-700",
            saveStatus === "saving" && "text-primary",
            saveStatus === "error" && "text-destructive",
            saveStatus === "partial" && "text-warning"
          )}
        >
          {saveStatus === "saved" && <Check size={14} aria-hidden />}
          {saveStatus === "saving" && <Loader2 size={14} className="animate-spin" aria-hidden />}
          {(saveStatus === "error" || saveStatus === "partial") && <AlertCircle size={14} aria-hidden />}
          <span>{statusLabel}</span>
          {compact && savedAt && <span className="font-normal text-muted">· {savedAt}</span>}
        </div>
      )}
      {!compact && locationHint && (
        <p className="text-xs text-muted" data-testid="save-status-location">
          {locationHint}
        </p>
      )}
      {saveStatus === "partial" && (
        <p className="text-xs text-muted" data-testid="save-status-partial">
          {t("storage.location.partial")}
        </p>
      )}
      {nearLimit && saveStatus !== "error" && (
        <p className="text-xs text-warning" data-testid="save-status-near-limit">
          {t("storage.nearLimit")}
        </p>
      )}
      {saveStatus === "error" && saveError && (
        <p className="text-xs text-destructive/90" data-testid="save-status-error" role="alert">
          {saveError}
        </p>
      )}
      {saveStatus === "error" && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="mt-1 w-fit"
          data-testid="save-status-retry"
          onClick={() => void flushPendingSave()}
        >
          <RefreshCw size={14} className="mr-1.5" aria-hidden />
          {t("storage.retry")}
        </Button>
      )}
      {!compact && savedAt && (
        <p className="text-xs text-muted">
          {t("storage.lastSaved")}: {savedAt}
        </p>
      )}
    </div>
  );
}
