"use client";

import { useState } from "react";
import { useI18n } from "@/lib/i18n/context";
import { getAiConsent, setAiConsent } from "@/lib/ai/consent-client";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

interface AiConsentBannerProps {
  requiresExternal: boolean;
  onConsentChange?: (granted: boolean) => void;
}

export function AiConsentBanner({ requiresExternal, onConsentChange }: AiConsentBannerProps) {
  const { t } = useI18n();
  const [consent, setConsent] = useState<"granted" | "denied" | null>(() =>
    typeof window !== "undefined" ? getAiConsent() : null
  );
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return requiresExternal && getAiConsent() !== "granted";
  });

  if (!requiresExternal) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm flex items-start gap-2">
        <Shield size={16} className="shrink-0 mt-0.5 text-primary" />
        <p>{t("ai.consent.localOnly")}</p>
      </div>
    );
  }

  if (!visible && consent === "granted") return null;

  return (
    <div className="rounded-xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm space-y-3">
      <p className="font-medium flex items-center gap-2">
        <Shield size={16} /> {t("ai.consent.title")}
      </p>
      <p className="text-muted text-xs">{t("ai.consent.body")}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => {
            setAiConsent("granted");
            setConsent("granted");
            setVisible(false);
            onConsentChange?.(true);
          }}
        >
          {t("ai.consent.grant")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            setAiConsent("denied");
            setConsent("denied");
            setVisible(false);
            onConsentChange?.(false);
          }}
        >
          {t("ai.consent.deny")}
        </Button>
        {consent === "granted" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setAiConsent("denied");
              setConsent("denied");
              onConsentChange?.(false);
            }}
          >
            {t("ai.consent.revoke")}
          </Button>
        )}
      </div>
    </div>
  );
}
