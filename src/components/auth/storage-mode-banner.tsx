"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/context";
import { getStorageMode } from "@/lib/auth/config";
import { getActiveStorageLabel } from "@/lib/storage/storage-config";
import { useI18n } from "@/lib/i18n/context";
import { Shield, HardDrive, Cloud, Download } from "lucide-react";
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
        isApi ? "border-primary/30 bg-primary/5" : "border-warning/40 bg-warning/10",
        className
      )}
    >
      {isApi ? <Cloud size={18} className="shrink-0 text-primary mt-0.5" /> : <HardDrive size={18} className="shrink-0 text-warning mt-0.5" />}
      <div className="space-y-1.5">
        <p className="font-medium flex items-center gap-2 text-primary">
          <Shield size={14} />
          {isApi ? t("auth.storage.api") : isLocalOnly ? t("auth.storage.local") : t("auth.storage.localAccount")}
        </p>
        <ul className="text-muted text-xs space-y-1 list-disc pl-4">
          <li>{t("auth.storage.localHint1")}</li>
          <li>{t("auth.storage.localHint2")}</li>
          <li>{t("auth.storage.localHint3")}</li>
          {!isApi && <li>{t("auth.storage.localHint4")}</li>}
        </ul>
        <p className="text-xs text-muted">{t("auth.storage.disclaimer")}</p>
        {session && (
          <p className="text-xs text-muted">
            {t("auth.loggedInAs")}: {session.user.email} ({authMode === "api" ? "API" : t("auth.mode.local")})
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-1">
          {!session && storageMode === "local" && (
            <p className="text-xs">
              <Link href="/login" className="text-primary hover:underline">{t("auth.login")}</Link>
              {" · "}
              <Link href="/register" className="text-primary hover:underline">{t("auth.register")}</Link>
            </p>
          )}
          <Link href="/dashboard/pdf" className="text-xs text-primary hover:underline inline-flex items-center gap-1">
            <Download size={12} /> Export / PDF
          </Link>
        </div>
      </div>
    </div>
  );
}
