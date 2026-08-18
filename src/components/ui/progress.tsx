import { cn } from "@/lib/utils/cn";

export function Progress({
  value,
  label,
  className,
}: {
  value: number;
  label?: string;
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn("w-full", className)}>
      {label ? (
        <div className="flex justify-between text-base mb-2">
          <span className="font-semibold text-foreground">{label}</span>
          <span className="text-primary font-bold">{clamped}%</span>
        </div>
      ) : null}
      <div
        className="h-3.5 bg-border rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ? `${label}: ${clamped} Prozent` : `Fortschritt: ${clamped} Prozent`}
      >
        <div className="h-full bg-emerald rounded-full transition-all duration-500" style={{ width: `${clamped}%` }} />
      </div>
    </div>
  );
}
