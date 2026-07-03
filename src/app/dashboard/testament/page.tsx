"use client";

import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { ModulePage } from "@/components/modules/module-page";
import { inheritanceFields } from "@/lib/modules/fields";
import { checkInheritance } from "@/lib/utils/progress";
import { Card, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const statusConfig = {
  green: {
    label: "Grün — Grundsätzlich in Ordnung",
    bg: "bg-success/10 border-success/30",
    text: "text-success",
    icon: CheckCircle,
  },
  yellow: {
    label: "Gelb — Bitte mit Imam & Anwalt prüfen",
    bg: "bg-warning/10 border-warning/30",
    text: "text-warning",
    icon: Info,
  },
  red: {
    label: "Rot — Möglicher Widerspruch zu Farāʾiḍ",
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
      description="Erfasse dein Erbprofil und prüfe Waṣiyya-Wünsche mit dem islamischen Ampelcheck."
      section="inheritanceProfile"
      fields={inheritanceFields}
      disclaimerType="islamic"
    >
      <Card className={cn("mt-6 border-2", config.bg)}>
        <CardTitle className={cn("flex items-center gap-2", config.text)}>
          <StatusIcon size={22} />
          Ampelcheck: {config.label}
        </CardTitle>

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
