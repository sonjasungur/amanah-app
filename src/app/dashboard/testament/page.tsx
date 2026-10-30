"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { ModulePage } from "@/components/modules/module-page";
import { inheritanceFields } from "@/lib/modules/fields";
import { checkInheritance } from "@/lib/utils/progress";
import { INHERITANCE_HINT_LABELS, INHERITANCE_HINT_NOTICE } from "@/lib/domain/validation";
import { Card, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const statusConfig = {
  green: {
    label: INHERITANCE_HINT_LABELS.green,
    bg: "bg-success/10 border-success/30",
    text: "text-success",
    icon: CheckCircle,
  },
  yellow: {
    label: INHERITANCE_HINT_LABELS.yellow,
    bg: "bg-warning/10 border-warning/30",
    text: "text-warning",
    icon: Info,
  },
  red: {
    label: INHERITANCE_HINT_LABELS.red,
    bg: "bg-danger/10 border-danger/30",
    text: "text-danger",
    icon: AlertTriangle,
  },
};

export default function TestamentPage() {
  const store = useAmanahStore();
  const result = checkInheritance(store.inheritanceProfile);
  const config = statusConfig[result.status];
  const StatusIcon = config.icon;

  return (
    <ModulePage
      title="Testament & Erbe"
      description="Erfasse dein Erbprofil und erhalte erste Hinweise zu deinen Waṣiyya-Wünschen."
      section="inheritanceProfile"
      fields={inheritanceFields}
      disclaimerType="islamic"
    >
      <Card className={cn("mt-6 border-2", config.bg)}>
        <CardTitle className={cn("flex items-center gap-2", config.text)}>
          <StatusIcon size={22} />
          Erste Hinweise: {config.label}
        </CardTitle>
        <p className="mt-2 text-sm text-muted">{INHERITANCE_HINT_NOTICE}</p>

        {result.warnings.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-danger mb-2">Warnungen</p>
            <ul className="space-y-2">
              {result.warnings.map((w, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle size={16} className="text-danger shrink-0 mt-0.5" />
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}

        {result.recommendations.length > 0 && (
          <div className="mt-4">
            <p className="text-sm font-medium text-primary mb-2">Empfehlungen</p>
            <ul className="space-y-2">
              {result.recommendations.map((r, i) => (
                <li key={i} className="text-sm flex items-start gap-2 text-muted">
                  <Info size={16} className="text-primary shrink-0 mt-0.5" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </ModulePage>
  );
}
