import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { AREA_STATUS_LABELS, formatAreaDate, type AreaState, type AreaStatus } from "@/lib/vorsorge/areas";

const PILL: Record<AreaStatus, string> = {
  nicht_begonnen: "bg-border/60 text-muted",
  begonnen: "bg-accent-soft text-primary",
  vollstaendig: "bg-emerald/15 text-primary-dark",
  pruefen: "bg-warning/15 text-warning",
};

const DOT: Record<AreaStatus, string> = {
  nicht_begonnen: "border-2 border-border bg-card",
  begonnen: "border-2 border-emerald bg-card",
  vollstaendig: "bg-emerald text-white",
  pruefen: "bg-warning text-white",
};

const SYMBOL: Record<AreaStatus, string> = { nicht_begonnen: "", begonnen: "", vollstaendig: "✓", pruefen: "!" };

/** The six areas with status and last change. Each row opens the area directly. */
export function AreaList({ states, testId = "area-list" }: { states: AreaState[]; testId?: string }) {
  return (
    <ul className="divide-y divide-border/70" data-testid={testId}>
      {states.map(({ area, status, missing, reviewReasons, updatedAt }) => {
        const date = formatAreaDate(updatedAt);
        const hint = status === "pruefen" ? reviewReasons[0] : status === "begonnen" ? `Es fehlt: ${missing[0]}` : null;
        return (
          <li key={area.id} data-testid={`area-${area.id}`} data-status={status}>
            <Link
              href={area.pages[0].path}
              className="flex items-center gap-3 py-3.5 min-h-[56px] rounded-lg hover:bg-accent-soft/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald/50 px-1"
            >
              <span className={cn("h-7 w-7 shrink-0 rounded-full grid place-items-center text-sm font-bold", DOT[status])} aria-hidden>
                {SYMBOL[status]}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block font-semibold text-foreground">{area.title}</span>
                <span className="block text-sm text-muted">{date ? `Zuletzt geändert am ${date}` : status === "nicht_begonnen" ? "Noch keine Angaben" : "Angaben vorhanden"}</span>
                {hint && <span className="block text-sm text-muted mt-0.5 break-words">{hint}</span>}
              </span>
              <span className={cn("shrink-0 text-xs font-semibold rounded-full px-2.5 py-1", PILL[status])}>{AREA_STATUS_LABELS[status]}</span>
              <ChevronRight size={16} className="text-muted shrink-0 hidden sm:block" aria-hidden />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
