"use client";

import type { PatchPreviewItem, SuggestedUpdate } from "@/lib/guided-flow/types";
import { formatPreviewValue } from "@/lib/guided-flow/patch-preview";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface PatchPreviewProps {
  items: PatchPreviewItem[];
  clarifications?: string[];
  onApply: (updates: SuggestedUpdate[]) => void;
  onEdit: () => void;
  onDismiss: () => void;
  loading?: boolean;
}

export function PatchPreview({
  items,
  clarifications,
  onApply,
  onEdit,
  onDismiss,
  loading,
}: PatchPreviewProps) {
  const { t } = useI18n();

  if (items.length === 0 && !clarifications?.length) return null;

  const statusLabel = (status: PatchPreviewItem["status"]) => {
    if (status === "safe") return t("guidedFlow.statusSafe");
    if (status === "uncertain") return t("guidedFlow.statusUncertain");
    return t("guidedFlow.statusClarification");
  };

  const updates: SuggestedUpdate[] = items.map((i) => ({
    fieldPath: i.fieldPath,
    label: i.label,
    value: i.newValue,
    confidence: i.confidence,
    moduleId: i.moduleId,
  }));

  return (
    <Card className="border-primary/20 bg-primary/5 space-y-3 mt-4">
      <p className="text-xs text-muted">{t("guidedFlow.noAutoSave")}</p>
      <p className="text-sm font-medium">{t("guidedFlow.detectedFields")}</p>

      {clarifications && clarifications.length > 0 && (
        <ul className="text-sm text-warning space-y-1">
          {clarifications.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      )}

      {items.length > 0 && (
        <ul className="space-y-3 text-sm">
          {items.map((item) => (
            <li key={item.fieldPath} className="border-b border-primary/10 pb-2">
              <div className="flex justify-between gap-2">
                <span className="text-muted">{item.label}</span>
                <span className="text-xs text-primary">{item.moduleId}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-1 text-xs">
                <div>
                  <span className="text-muted">Alt: </span>
                  {formatPreviewValue(item.oldValue)}
                </div>
                <div>
                  <span className="text-muted">Neu: </span>
                  <span className="font-medium">{formatPreviewValue(item.newValue)}</span>
                </div>
              </div>
              <p className="text-xs mt-1 text-muted">{statusLabel(item.status)}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-2">
        {items.length > 0 && (
          <Button size="sm" onClick={() => onApply(updates)} disabled={loading}>
            {t("guidedFlow.applyNext")}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onEdit} disabled={loading}>
          {t("guidedFlow.edit")}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDismiss} disabled={loading}>
          {t("guidedFlow.dismiss")}
        </Button>
      </div>
    </Card>
  );
}
