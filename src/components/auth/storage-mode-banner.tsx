"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { buildAuthHref } from "@/lib/auth/return-url";
import { useActiveStorageLabel } from "@/lib/storage/use-storage-label";
import { useAuth } from "@/lib/auth/context";
import { getStorageMode } from "@/lib/auth/config";
import { useI18n } from "@/lib/i18n/context";
import { Shield, HardDrive, Cloud, Download } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { SaveStatusIndicator } from "@/components/storage/save-status-indicator";

export function StorageModeBanner({ className }: { className?: string }) {
  const { session, authMode } = useAuth();
  const { t } = useI18n();
  const storageMode = getStorageMode();
  const activeLabel = useActiveStorageLabel();
  // Back to this very page after signing in or registering (EA-04.4).
  const here = usePathname() || "/dashboard";

  const isLocalOnly = activeLabel === "local";
  const isApi = activeLabel === "api";

  // Signed in: the account holds the folder. One line with the save status; how storage works on request.
  if (isApi) {
    return (
      <div
        className={cn("no-print rounded-xl border border-primary/20 bg-primary/5 px-4 py-2.5 text-sm", className)}
        data-testid="storage-status-bar"
      >
        <SaveStatusIndicator compact fallback={t("storage.location.api")} />
        <details className="mt-1 text-xs text-muted">
          <summary className="cursor-pointer text-primary hover:underline w-fit">{t("auth.storage.apiDetails")}</summary>
          <ul className="mt-2 space-y-1 list-disc pl-4">
            <li>{t("auth.storage.apiHint1")}</li>
            <li>{t("auth.storage.apiHint2")}</li>
            <li>{t("storage.warning")}</li>
            <li>{t("auth.storage.apiHint3")}</li>
          </ul>
          <p className="mt-2">{t("auth.storage.disclaimer")}</p>
          {session && (
            <p className="mt-1">
              {t("auth.loggedInAs")}: {session.user.email}
            </p>
          )}
          <Link href="/dashboard/einstellungen#export-sicherung" className="mt-1 inline-flex items-center gap-1 text-primary hover:underline">
            <Download size={12} /> {t("storage.exportAndBackup")}
          </Link>
        </details>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "no-print rounded-xl border px-4 py-3 text-sm flex items-start gap-3",
        isApi ? "border-primary/30 bg-primary/5" : "border-warning/40 bg-warning/10",
        className
      )}
    >
      {isApi ? <Cloud size={18} className="shrink-0 text-primary mt-0.5" /> : <HardDrive size={18} className="shrink-0 text-warning mt-0.5" />}
      <div className="space-y-1.5">
        <SaveStatusIndicator compact />
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
            {t("auth.loggedInAs")}: {session.user.email}
            {authMode !== "api" && ` (${t("auth.mode.local")})`}
          </p>
        )}
        <div className="flex flex-wrap gap-3 pt-1">
          {!session && storageMode === "local" && (
            <p className="text-xs">
              <Link href={buildAuthHref("/login", here)} className="text-primary hover:underline">{t("auth.login")}</Link>
              {" · "}
              <Link href={buildAuthHref("/register", here)} className="text-primary hover:underline">{t("auth.register")}</Link>
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
