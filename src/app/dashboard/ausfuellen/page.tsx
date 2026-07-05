"use client";

import Link from "next/link";
import { useGuidedFlow } from "@/lib/guided-flow/use-guided-flow";
import { getSkippedQuestionDetails } from "@/lib/guided-flow/flow-engine";
import { PatchPreview } from "@/components/guided-flow/patch-preview";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { FLOW_DISCLAIMER } from "@/lib/guided-flow/config";
import { openReadableEmergencyExport } from "@/lib/export/readable-emergency-export";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  FileText,
  PauseCircle,
  PlayCircle,
  RotateCcw,
  SkipForward,
} from "lucide-react";

export default function AusfuellenPage() {
  const { t } = useI18n();
  const store = useAmanahStore();
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
    resumeFlow,
    retrySkippedQuestion,
  } = useGuidedFlow();

  const isReviewing = state.flowMode === "reviewing";
  const isPaused = state.flowMode === "paused";
  const skippedDetails = getSkippedQuestionDetails(state.skippedQuestions);

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
        </Card>
      )}

      {isPaused && (
        <Card className="p-6 text-center space-y-4 border-primary/20 bg-primary/5">
          <PauseCircle size={40} className="mx-auto text-primary" />
          <p className="text-lg font-medium text-primary">{t("guidedFlow.pausedTitle")}</p>
          <p className="text-sm text-muted">{t("guidedFlow.pausedHint")}</p>
          <Button onClick={resumeFlow} disabled={loading}>
            <PlayCircle size={18} className="mr-2" /> {t("guidedFlow.resume")}
          </Button>
        </Card>
      )}

      {state.flowMode === "done" && !currentQuestion ? (
        <Card className="p-8 text-center space-y-4 border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
          <CheckCircle2 size={48} className="mx-auto text-primary" />
          <p className="text-xl font-semibold text-primary">{t("guidedFlow.doneTitle")}</p>
          <p className="text-sm text-muted">{t("guidedFlow.foundationsDone")}</p>
          <p className="text-sm text-muted">{t("guidedFlow.doneHint")}</p>
          <div className="flex flex-wrap justify-center gap-2 pt-2">
            <Link href="/dashboard">
              <Button>{t("nav.dashboard")}</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => openReadableEmergencyExport(pickDataFields(store))}
            >
              <FileText size={16} className="mr-2" /> {t("export.readableBtn")}
            </Button>
          </div>
        </Card>
      ) : !isPaused && currentQuestion ? (
        <Card className="p-6 space-y-4">
          <CardTitle className="text-lg">{currentQuestion.questionText}</CardTitle>
          <p className="text-sm text-muted">{currentQuestion.helpText}</p>
          {(currentQuestion.safetyNotice || currentQuestion.sensitivity === "high") && (
            <p className="text-xs text-warning border border-warning/20 rounded-lg p-3">
              {currentQuestion.safetyNotice || t("guidedFlow.safetyHint")}
            </p>
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
              <p className="text-xs text-muted">{t("guidedFlow.noAutoSave")}</p>
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
      ) : !isPaused && !currentQuestion && state.flowMode !== "done" ? (
        <Card className="p-6 text-center">
          <p className="text-muted">{loading ? "…" : t("guidedFlow.loading")}</p>
        </Card>
      ) : null}

      {skippedDetails.length > 0 && (
        <Card className="p-4 space-y-3">
          <CardTitle className="text-base">{t("guidedFlow.skippedTitle")}</CardTitle>
          <ul className="space-y-2">
            {skippedDetails.map((q) => (
              <li key={q.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                <span className="text-muted">{q.questionText}</span>
                <Button size="sm" variant="outline" onClick={() => retrySkippedQuestion(q.id)} disabled={loading}>
                  <RotateCcw size={14} className="mr-1" /> {t("guidedFlow.retrySkipped")}
                </Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <p className="text-xs text-muted text-center">
        {t("guidedFlow.disclaimerShort")}
      </p>
    </div>
  );
}
