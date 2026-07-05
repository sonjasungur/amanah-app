import type { AmanahOrdnerData } from "@/lib/domain/types";
import { GUIDED_QUESTION_PLAN } from "./question-plan";
import { isQuestionAnswered } from "./flow-engine";
import type { FlowProgress } from "./types";

export function computeFlowProgress(
  data: AmanahOrdnerData,
  skippedQuestions: string[] = [],
  completedQuestions: string[] = []
): FlowProgress {
  const skipped = new Set(skippedQuestions);
  const completed = new Set(completedQuestions);

  let completedCount = 0;
  let skippedCount = 0;
  let criticalTotal = 0;
  let criticalCompleted = 0;

  for (const q of GUIDED_QUESTION_PLAN) {
    if (q.critical) criticalTotal++;
    const answered = isQuestionAnswered(data, q) || completed.has(q.id);
    const skippedQ = skipped.has(q.id);

    if (answered) {
      completedCount++;
      if (q.critical) criticalCompleted++;
    } else if (skippedQ) {
      skippedCount++;
    } else if (isQuestionAnswered(data, q)) {
      if (q.critical) criticalCompleted++;
    }
  }

  for (const q of GUIDED_QUESTION_PLAN) {
    if (isQuestionAnswered(data, q) && !completed.has(q.id)) {
      if (q.critical && criticalCompleted < criticalTotal) {
        criticalCompleted++;
      }
    }
  }

  const total = GUIDED_QUESTION_PLAN.length;
  const answeredInData = GUIDED_QUESTION_PLAN.filter((q) => isQuestionAnswered(data, q)).length;
  const effectiveCompleted = Math.max(completedCount, answeredInData);
  const remaining = total - effectiveCompleted - skippedCount;
  const percent = Math.round((effectiveCompleted / total) * 100);

  const criticalAnswered = GUIDED_QUESTION_PLAN.filter(
    (q) => q.critical && (isQuestionAnswered(data, q) || completed.has(q.id))
  ).length;

  return {
    total,
    completed: effectiveCompleted,
    skipped: skippedCount,
    remaining: Math.max(0, remaining),
    criticalTotal,
    criticalCompleted: criticalAnswered,
    percent,
    allCriticalDone: criticalAnswered >= criticalTotal,
  };
}
