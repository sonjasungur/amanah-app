"use client";

import { useAuth } from "@/lib/auth/context";
import { getStorageMode } from "@/lib/auth/config";
import { getActiveStorageLabel } from "@/lib/storage/storage-config";
import { useI18n } from "@/lib/i18n/context";
import { Shield, HardDrive, Cloud } from "lucide-react";
import { cn } from "@/lib/utils/cn";

export function StorageModeBanner({ className }: { className?: string }) {
  const { session, authMode } = useAuth();
  const { t } = useI18n();
  const storageMode = getStorageMode();
  const activeLabel = getActiveStorageLabel();

  const isLocalOnly = activeLabel === "local";
  const isApi = activeLabel === "api";

  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3 text-sm flex items-start gap-3",
        isApi ? "border-primary/30 bg-primary/5" : "border-warning/30 bg-warning/5",
        className
      )}
    >
      {isApi ? <Cloud size={18} className="shrink-0 text-primary mt-0.5" /> : <HardDrive size={18} className="shrink-0 text-warning mt-0.5" />}
      <div>
        <p className="font-medium flex items-center gap-2">
          <Shield size={14} />
          {isApi ? t("auth.storage.api") : isLocalOnly ? t("auth.storage.local") : t("auth.storage.localAccount")}
        </p>
        <p className="text-muted text-xs mt-1">{t("auth.storage.disclaimer")}</p>
        {session && (
          <p className="text-xs mt-1 text-muted">
            {t("auth.loggedInAs")}: {session.user.email} ({authMode === "api" ? "API" : t("auth.mode.local")})
          </p>
        )}
        {!session && storageMode === "local" && (
          <p className="text-xs mt-1">
            <a href="/login" className="text-primary hover:underline">{t("auth.login")}</a>
            {" · "}
            <a href="/register" className="text-primary hover:underline">{t("auth.register")}</a>
          </p>
        )}
      </div>
    </div>
  );
}
