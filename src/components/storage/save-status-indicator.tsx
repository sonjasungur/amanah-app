"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { useActiveStorageLabel } from "@/lib/storage/use-storage-label";
import { useI18n } from "@/lib/i18n/context";
import { flushPendingSave } from "@/lib/storage/store-sync";
import { AlertCircle, Check, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";

export function SaveStatusIndicator({ className }: { className?: string }) {
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

  if (folderProblem || (!statusLabel && saveStatus === "idle")) return null;

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
        </div>
      )}
      {locationHint && (
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
      {saveStatus === "saved" && lastSaved && (
        <p className="text-xs text-muted">
          {t("storage.lastSaved")}: {new Date(lastSaved).toLocaleString()}
        </p>
      )}
    </div>
  );
}
