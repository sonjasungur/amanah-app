import { cn } from "@/lib/utils/cn";

interface DisclaimerProps {
  type?: "main" | "islamic" | "legal";
  className?: string;
}

const texts = {
  main: "Diese Plattform ersetzt keinen Imam, Gelehrten, Arzt, Anwalt oder Notar. Sie hilft dir, deine Wünsche und Fragen geordnet vorzubereiten.",
  islamic: "Die Inhalte dienen der Orientierung. Sie ersetzen keine Fatwa und keine individuelle Prüfung durch qualifizierte islamische Gelehrte.",
  legal: "Die Inhalte ersetzen keine Rechtsberatung, notarielle Beratung, ärztliche Beratung oder offizielle Patientenverfügung.",
};

export function Disclaimer({ type = "main", className }: DisclaimerProps) {
  return (
    <div className={cn("rounded-xl bg-sand border border-accent/30 px-4 py-3 text-sm text-muted", className)}>
      <span className="text-accent mr-1">ℹ️</span>
      {texts[type]}
    </div>
  );
}
