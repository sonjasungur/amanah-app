import { computeCheckResult, type CheckPrimaryRecommendation } from "@/lib/check/results";
import { hasCheckProgress } from "@/lib/check/progress";
import type { AmanahOrdnerData } from "@/lib/domain/types";
import { getAllModuleProgress, getRecommendedNextStep } from "@/lib/domain/validation";
import { moduleConfigs } from "@/lib/modules/config";

export interface PlanNextStep {
  id: string;
  title: string;
  path: string;
  reason: string;
}

export function getPlanNextStep(data: AmanahOrdnerData): PlanNextStep {
  if (hasCheckProgress(data.checkProgress) && data.checkProgress.phase === "result") {
    const rec = computeCheckResult(data.checkProgress.answers).primaryRecommendation;
    return fromRecommendation(rec);
  }

  if (hasCheckProgress(data.checkProgress) && Object.keys(data.checkProgress.answers).length > 0) {
    const rec = computeCheckResult(data.checkProgress.answers).primaryRecommendation;
    if (rec.id !== "plan") return fromRecommendation(rec);
  }

  const fallback = getRecommendedNextStep(data);
  return {
    id: String(fallback.moduleId),
    title: fallback.title,
    path: fallback.path,
    reason: "Nächster offener Bereich in deinem Vorsorgeplan.",
  };
}

function fromRecommendation(rec: CheckPrimaryRecommendation): PlanNextStep {
  return {
    id: rec.id,
    title: rec.label,
    path: rec.href,
    reason: rec.reason,
  };
}

export function getPrioritizedPlanItems(data: AmanahOrdnerData, limit = 3) {
  const next = getPlanNextStep(data);
  const progress = getAllModuleProgress(data);
  const byPath = new Map(moduleConfigs.map((m) => [m.path, m]));
  const items = progress
    .filter((m) => m.percent < 80)
    .sort((a, b) => a.percent - b.percent)
    .map((m) => {
      const config = moduleConfigs.find((c) => c.id === m.moduleId);
      return {
        id: m.moduleId,
        title: config?.title ?? m.moduleId,
        path: config?.path ?? "/dashboard",
        percent: m.percent,
      };
    })
    .filter((item) => item.path !== next.path);

  const primary = byPath.get(next.path);
  const leading = primary
    ? [{ id: primary.id, title: next.title, path: next.path, percent: progress.find((p) => p.moduleId === primary.id)?.percent ?? 0 }]
    : [];

  return [...leading, ...items].slice(0, limit);
}
