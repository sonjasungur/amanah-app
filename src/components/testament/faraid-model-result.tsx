import { Fragment } from "react";
import { isRuleSetDisplayable, toString as fractionText, type FaraidResult, type HeirKey } from "@/lib/inheritance";

const HEIR_LABELS: Record<HeirKey, string> = {
  husband: "Ehemann",
  wives: "Ehefrau",
  sons: "Söhne",
  daughters: "Töchter",
  father: "Vater",
  mother: "Mutter",
};

/**
 * Shows the shares of a calculated model. Renders nothing unless the product flag is on AND the
 * rule set carries a recorded scholar review: with the current unreviewed rule set this never
 * appears, whatever the flag says. It is a model for a conversation, never a will or a ruling.
 */
export function FaraidModelResult({ model, featureEnabled }: { model: Extract<FaraidResult, { status: "calculated" }>; featureEnabled: boolean }) {
  if (!isRuleSetDisplayable(model.ruleSet, featureEnabled)) return null;
  return (
    <div className="mt-3" data-testid="faraid-model-result">
      <dl className="text-sm grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
        {model.shares.map((s) => (
          <Fragment key={s.heir}>
            <dt className="text-muted">
              {HEIR_LABELS[s.heir]}
              {s.count > 1 ? ` (${s.count})` : ""}
            </dt>
            <dd>
              {fractionText(s.groupShare)}
              {s.count > 1 ? ` (je ${fractionText(s.perPerson)})` : ""}
            </dd>
          </Fragment>
        ))}
      </dl>
      <details className="text-xs text-muted mt-2" data-testid="faraid-model-steps">
        <summary className="cursor-pointer">So rechnet das Modell</summary>
        <ul className="list-disc pl-5 mt-1 space-y-1">
          {model.steps.map((step) => (
            <li key={step.rule}>{step.rule}</li>
          ))}
        </ul>
      </details>
      <p className="text-xs text-muted mt-2">
        Modellinformation nach dem Regelwerk {model.ruleSet.id} {model.ruleSet.version}, geprüft von {model.ruleSet.reviewedBy} am {model.ruleSet.reviewedAt}. Anteile am Nachlass nach Bestattungskosten, Schulden und Vermächtnissen. Kein Testament und keine Rechtsauskunft; nach deutschem Recht kann sich etwas anderes ergeben.
      </p>
    </div>
  );
}
