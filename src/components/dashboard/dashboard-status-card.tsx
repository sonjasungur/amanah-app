"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { getActiveStorageLabel } from "@/lib/storage/storage-config";
import { getAiConsent } from "@/lib/ai/consent-client";
import { openReadableEmergencyExport } from "@/lib/export/readable-emergency-export";
import { useI18n } from "@/lib/i18n/context";
import { Card, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Compass, Database, FileText, Shield } from "lucide-react";

interface HealthSnapshot {
  aiEnabled?: boolean;
  aiProvider?: string;
  aiRequiresConsent?: boolean;
}

export function DashboardStatusCard() {
  const store = useAmanahStore();
  const { t } = useI18n();
  const [health, setHealth] = useState<HealthSnapshot>({});

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  const storageLabel = getActiveStorageLabel();
  const storageText =
    storageLabel === "api"
      ? t("status.storage.api")
      : storageLabel === "local-demo"
        ? t("status.storage.localDemo")
        : t("status.storage.local");

  const aiProvider = health.aiProvider ?? "rules";
  const aiText =
    aiProvider === "openai"
      ? health.aiRequiresConsent && getAiConsent() !== "granted"
        ? t("status.ai.openaiPending")
        : t("status.ai.openai")
      : t("status.ai.rules");

  return (
    <Card className="border-primary/15">
      <CardTitle className="flex items-center gap-2 text-base">
        <Shield size={18} /> {t("status.title")}
      </CardTitle>
      <p className="text-xs text-muted mt-1">{t("status.betaHint")}</p>
      <div className="grid sm:grid-cols-2 gap-3 mt-4 text-sm">
        <div className="flex items-start gap-2 p-3 rounded-xl bg-sand/80">
          <Database size={16} className="shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-primary">{t("status.storageLabel")}</p>
            <p className="text-muted text-xs">{storageText}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-sand/80">
          <Bot size={16} className="shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-primary">{t("status.aiLabel")}</p>
            <p className="text-muted text-xs">{aiText}</p>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-sand/80">
          <Compass size={16} className="shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-primary">{t("status.guidedLabel")}</p>
            <Link href="/dashboard/ausfuellen" className="text-xs text-primary-light underline">
              {t("guidedFlow.title")} →
            </Link>
          </div>
        </div>
        <div className="flex items-start gap-2 p-3 rounded-xl bg-sand/80">
          <FileText size={16} className="shrink-0 mt-0.5 text-primary" />
          <div>
            <p className="font-medium text-primary">{t("status.exportLabel")}</p>
            <Button
              size="sm"
              variant="ghost"
              className="h-auto p-0 text-xs text-primary-light underline"
              onClick={() => openReadableEmergencyExport(pickDataFields(store))}
            >
              {t("export.readableBtn")}
            </Button>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted mt-3">
        <Link href="/sicherheit" className="underline hover:text-primary">
          {t("privacy.securityLink")}
        </Link>
        {" · "}
        <Link href="/datenschutz" className="underline hover:text-primary">
          {t("privacy.title")}
        </Link>
      </p>
    </Card>
  );
}
