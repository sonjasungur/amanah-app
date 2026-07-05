"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { useI18n } from "@/lib/i18n/context";
import { AlertCircle, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function SaveStatusIndicator({ className }: { className?: string }) {
  const saveStatus = useAmanahStore((s) => s.saveStatus);
  const saveError = useAmanahStore((s) => s.saveError);
  const lastSaved = useAmanahStore((s) => s.lastSaved);
  const { t } = useI18n();

  const label =
    saveStatus === "saved"
      ? t("storage.status.saved")
      : saveStatus === "saving"
        ? t("storage.status.saving")
        : saveStatus === "error"
          ? t("storage.status.error")
          : null;

  if (!label && saveStatus === "idle") return null;

  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div
        className={cn(
          "flex items-center gap-2 text-xs font-medium",
          saveStatus === "saved" && "text-green-700",
          saveStatus === "saving" && "text-primary",
          saveStatus === "error" && "text-destructive"
        )}
      >
        {saveStatus === "saved" && <Check size={14} />}
        {saveStatus === "saving" && <Loader2 size={14} className="animate-spin" />}
        {saveStatus === "error" && <AlertCircle size={14} />}
        <span>{label}</span>
      </div>
      {saveStatus === "error" && saveError && (
        <p className="text-xs text-destructive/80">{saveError}</p>
      )}
      {saveStatus === "saved" && lastSaved && (
        <p className="text-xs text-muted">
          {t("storage.lastSaved")}: {new Date(lastSaved).toLocaleString()}
        </p>
      )}
    </div>
  );
}
