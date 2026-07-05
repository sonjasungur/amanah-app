"use client";

import Link from "next/link";
import { useGuidedFlow } from "@/lib/guided-flow/use-guided-flow";
import { PatchPreview } from "@/components/guided-flow/patch-preview";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { FLOW_DISCLAIMER } from "@/lib/guided-flow/config";
import { ArrowLeft, Compass, SkipForward, PauseCircle } from "lucide-react";

export default function AusfuellenPage() {
  const { t } = useI18n();
  const {
    state,
    setState,
    currentQuestion,
    flowProgress,
    previewItems,
    loading,
    successMessage,
    parseAnswer,
    applyUpdates,
    skipQuestion,
    discardPreview,
    pauseFlow,
  } = useGuidedFlow();

  const isReviewing = state.flowMode === "reviewing";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/assistent" className="text-primary hover:underline text-sm flex items-center gap-1">
          <ArrowLeft size={16} /> Assistent
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-primary flex items-center gap-2">
          <Compass size={28} /> {t("guidedFlow.title")}
        </h1>
        <p className="text-muted text-sm mt-2">{FLOW_DISCLAIMER}</p>
      </div>

      {flowProgress && (
        <Card className="p-4">
          <div className="flex justify-between text-sm mb-2">
            <span>{t("guidedFlow.progress")}</span>
            <span className="font-medium">{flowProgress.percent}%</span>
          </div>
          <div className="h-2 bg-sand rounded-full overflow-hidden">
            <div
              className="h-full bg-primary/70 transition-all duration-500"
              style={{ width: `${flowProgress.percent}%` }}
            />
          </div>
          <p className="text-xs text-muted mt-2">
            {flowProgress.completed} / {flowProgress.total} · {t("guidedFlow.critical")}: {flowProgress.criticalCompleted}/{flowProgress.criticalTotal}
          </p>
          {flowProgress.allCriticalDone && state.flowMode === "done" && (
            <p className="text-sm text-primary mt-3 font-medium">{t("guidedFlow.foundationsDone")}</p>
          )}
        </Card>
      )}

      {state.flowMode === "done" && !currentQuestion ? (
        <Card className="p-6 text-center space-y-4">
          <p className="text-lg font-medium text-primary">{t("guidedFlow.foundationsDone")}</p>
          <p className="text-sm text-muted">{t("guidedFlow.doneHint")}</p>
          <Link href="/dashboard">
            <Button>{t("nav.dashboard")}</Button>
          </Link>
        </Card>
      ) : currentQuestion ? (
        <Card className="p-6 space-y-4">
          <CardTitle className="text-lg">{currentQuestion.questionText}</CardTitle>
          <p className="text-sm text-muted">{currentQuestion.helpText}</p>
          {currentQuestion.safetyNotice && (
            <p className="text-xs text-warning border border-warning/20 rounded-lg p-3">{currentQuestion.safetyNotice}</p>
          )}

          {!isReviewing && (
            <>
              <Textarea
                value={state.answerDraft}
                onChange={(e) => setState((s) => ({ ...s, answerDraft: e.target.value }))}
                placeholder={t("guidedFlow.answerPlaceholder")}
                className="min-h-[100px]"
                disabled={loading}
              />
              <div className="flex flex-wrap gap-2">
                <Button onClick={parseAnswer} disabled={loading || !state.answerDraft.trim()}>
                  {loading ? "…" : t("guidedFlow.checkSuggestion")}
                </Button>
                {currentQuestion.canSkip && (
                  <Button variant="outline" onClick={skipQuestion} disabled={loading}>
                    <SkipForward size={16} className="mr-1" /> {t("guidedFlow.skip")}
                  </Button>
                )}
                <Button variant="ghost" onClick={pauseFlow} disabled={loading}>
                  <PauseCircle size={16} className="mr-1" /> {t("guidedFlow.continueLater")}
                </Button>
              </div>
            </>
          )}

          {successMessage && (
            <p className="text-sm text-primary bg-primary/10 rounded-lg p-3">{successMessage}</p>
          )}

          {state.error && (
            <p className="text-sm text-warning bg-warning/10 rounded-lg p-3">{state.error}</p>
          )}

          {isReviewing && (
            <PatchPreview
              items={previewItems}
              clarifications={state.clarificationNeeded}
              onApply={(updates) => applyUpdates(updates)}
              onEdit={discardPreview}
              onDismiss={discardPreview}
              loading={loading}
            />
          )}
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <p className="text-muted">{loading ? "…" : t("guidedFlow.loading")}</p>
        </Card>
      )}

      <p className="text-xs text-muted text-center">
        {t("guidedFlow.disclaimerShort")}
      </p>
    </div>
  );
}
