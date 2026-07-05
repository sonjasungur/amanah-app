import type { ExtractSuggestion } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AiSuggestionCardProps {
  suggestions: ExtractSuggestion[];
  clarificationNeeded?: string[];
  previewNote?: string;
  onApply: (suggestions: ExtractSuggestion[]) => void;
  onDismiss: () => void;
  applyLabel: string;
  dismissLabel?: string;
}

export function AiSuggestionCard({
  suggestions,
  clarificationNeeded,
  previewNote,
  onApply,
  onDismiss,
  applyLabel,
  dismissLabel = "Verwerfen",
}: AiSuggestionCardProps) {
  if (suggestions.length === 0 && !clarificationNeeded?.length) return null;

  return (
    <Card className="border-primary/20 bg-primary/5 space-y-3">
      {previewNote && <p className="text-xs text-muted">{previewNote}</p>}
      {clarificationNeeded && clarificationNeeded.length > 0 && (
        <ul className="text-sm text-warning space-y-1">
          {clarificationNeeded.map((c) => (
            <li key={c}>• {c}</li>
          ))}
        </ul>
      )}
      {suggestions.length > 0 && (
        <ul className="space-y-2 text-sm">
          {suggestions.map((s) => (
            <li key={s.fieldPath} className="flex justify-between gap-2 border-b border-primary/10 pb-2">
              <span className="text-muted">{s.label}</span>
              <span className="font-medium text-right">{String(s.value)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        {suggestions.length > 0 && (
          <Button size="sm" onClick={() => onApply(suggestions)}>
            {applyLabel}
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={onDismiss}>
          {dismissLabel}
        </Button>
      </div>
    </Card>
  );
}
