"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { syncStoreWithRemoteAfterAuth } from "@/lib/storage/store-sync";
import { useAmanahStore } from "@/lib/store/use-amanah-store";

/** Empty forms over an unread folder would look like a new start: they stay away until it is read. */
export function FolderProblemGate({ children }: { children: React.ReactNode }) {
  const problem = useAmanahStore((s) => s.folderProblem);
  const pathname = usePathname();
  const { t } = useI18n();
  const [checking, setChecking] = useState(false);
  if (!problem) return <>{children}</>;

  const inSettings = pathname === "/dashboard/einstellungen";
  const retry = async () => {
    setChecking(true);
    await syncStoreWithRemoteAfterAuth();
    setChecking(false);
  };
  return (
    <>
      <Card className="mb-6 border-destructive/40" data-testid="folder-problem" role="alert">
        <CardTitle className="flex items-center gap-2 text-destructive">
          <AlertCircle size={18} aria-hidden />
          {t(`folderProblem.${problem}.title`)}
        </CardTitle>
        <p className="mt-2 text-sm text-foreground">{t(`folderProblem.${problem}.text`)}</p>
        <Button type="button" variant="outline" size="sm" className="mt-3" disabled={checking} data-testid="folder-problem-retry" onClick={() => void retry()}>
          <RefreshCw size={14} className="mr-1.5" aria-hidden />
          {t(checking ? "folderProblem.checking" : "folderProblem.retry")}
        </Button>
        {!inSettings && (
          <p className="mt-3 text-xs text-muted">
            <Link href="/dashboard/einstellungen" className="underline">
              {t("folderProblem.settingsHint")}
            </Link>
          </p>
        )}
      </Card>
      {inSettings && children}
    </>
  );
}
