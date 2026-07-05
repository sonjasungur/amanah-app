"use client";

import type { KnowledgeCitation } from "@/lib/ai/types";
import { useI18n } from "@/lib/i18n/context";

interface AiKnowledgeResultProps {
  answer: string;
  blocked?: boolean;
  noSource?: boolean;
  citations?: KnowledgeCitation[];
  suggestedNextStep?: string;
}

export function AiKnowledgeResult({
  answer,
  blocked,
  noSource,
  citations,
  suggestedNextStep,
}: AiKnowledgeResultProps) {
  const { t } = useI18n();

  return (
    <div className="mt-3 space-y-3">
      <p
        className={`text-sm p-3 rounded-xl whitespace-pre-wrap ${
          blocked ? "bg-warning/10 border border-warning/30" : "bg-sand"
        }`}
      >
        {answer}
      </p>

      {noSource && (
        <p className="text-xs text-muted">{t("knowledge.noSource")}</p>
      )}

      {citations && citations.length > 0 && (
        <div className="rounded-xl border border-primary/15 p-3 space-y-2">
          <p className="text-xs font-medium text-primary">{t("knowledge.sources")}</p>
          <ul className="space-y-2">
            {citations.map((c) => (
              <li key={c.entryId} className="text-xs text-muted">
                <span className="font-medium text-foreground">{c.title}</span>
                <span className="block">{c.category} · {c.sourceLabel}</span>
                <span className="block italic">{t("knowledge.orientation")}</span>
                {c.reviewedStatus !== "reviewed" && (
                  <span className="block text-warning">{t("knowledge.reviewStatus")}: {c.reviewedStatus}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {suggestedNextStep && !blocked && (
        <p className="text-xs text-muted">{suggestedNextStep}</p>
      )}
    </div>
  );
}
