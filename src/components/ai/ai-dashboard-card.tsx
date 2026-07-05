"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { getAiConsent } from "@/lib/ai/consent-client";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Bot, HelpCircle, ListChecks, ArrowRight } from "lucide-react";

export function AiDashboardCard() {
  const store = useAmanahStore();
  const { t } = useI18n();
  const [loading, setLoading] = useState<string | null>(null);
  const [nextQuestion, setNextQuestion] = useState<string | null>(null);
  const [reviewSummary, setReviewSummary] = useState<string | null>(null);
  const [requiresExternal, setRequiresExternal] = useState(false);

  useEffect(() => {
    fetch("/api/ai/status")
      .then((r) => r.json())
      .then((s) => setRequiresExternal(s.requiresExternalConsent === true))
      .catch(() => {});
  }, []);

  const postAi = async (path: string) => {
    const consentGranted = getAiConsent() === "granted";
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data: pickDataFields(store), consentGranted }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error || "Fehler");
    return json;
  };

  return (
    <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-card">
      <CardTitle className="flex items-center gap-2">
        <Bot size={20} /> {t("ai.title")}
      </CardTitle>
      <p className="text-sm text-muted mt-2">{t("ai.subtitle")}</p>
      {requiresExternal && getAiConsent() !== "granted" && (
        <p className="text-xs text-warning mt-2">{t("ai.consent.required")}</p>
      )}
      <div className="flex flex-wrap gap-2 mt-4">
        <Button
          size="sm"
          onClick={async () => {
            setLoading("next");
            try {
              const r = await postAi("/api/ai/next-question");
              setNextQuestion(r.question);
            } catch {
              setNextQuestion(t("ai.error.generic"));
            }
            setLoading(null);
          }}
          disabled={!!loading}
        >
          <HelpCircle size={14} className="mr-1" />
          {loading === "next" ? "…" : t("ai.nextQuestionBtn")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            setLoading("review");
            try {
              const r = await postAi("/api/ai/completion-review");
              setReviewSummary(r.summary);
            } catch {
              setReviewSummary(null);
            }
            setLoading(null);
          }}
          disabled={!!loading}
        >
          <ListChecks size={14} className="mr-1" />
          {loading === "review" ? "…" : t("ai.reviewBtn")}
        </Button>
        <Link href="/dashboard/assistent">
          <Button size="sm" variant="ghost">
            {t("ai.openAssistant")} <ArrowRight size={14} className="ml-1" />
          </Button>
        </Link>
      </div>
      {nextQuestion && (
        <p className="text-sm mt-3 p-3 bg-sand rounded-xl">{nextQuestion}</p>
      )}
      {reviewSummary && (
        <p className="text-sm mt-3 p-3 bg-sand rounded-xl">{reviewSummary}</p>
      )}
    </Card>
  );
}
