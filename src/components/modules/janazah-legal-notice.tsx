import { cn } from "@/lib/utils/cn";

export function JanazahLegalNotice({ className }: { className?: string }) {
  return (
    <aside
      className={cn(
        "rounded-xl border border-warning/30 bg-warning/5 px-4 py-4 text-sm text-foreground leading-relaxed",
        className
      )}
      data-testid="janazah-legal-notice"
    >
      <p className="font-semibold text-foreground mb-2">Rechtlicher und religiöser Hinweis</p>
      <ul className="space-y-2 text-muted list-disc pl-5">
        <li>Die Angaben sind persönliche Vorsorgewünsche — keine verbindliche Anweisung.</li>
        <li>Sie ersetzen keine Rechtsberatung und kein notarielles Testament.</li>
        <li>Religiöse Detailfragen können je nach Rechtsschule und Situation unterschiedlich bewertet werden.</li>
        <li>Für verbindliche Fragen sollen qualifizierte religiöse und rechtliche Ansprechpartner hinzugezogen werden.</li>
      </ul>
    </aside>
  );
}
