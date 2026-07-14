import { cn } from "@/lib/utils/cn";
import { COLORS } from "@/lib/design-tokens";

export type LogoVariantId = "A" | "B" | "C";

const BG = COLORS.navy;

/** A — Entscheidungs-Siegel: Ring + asymmetrische Entscheidungsmarke */
function MarkA({ mono }: { mono?: boolean }) {
  const ring = mono ? "#FFFFFF" : COLORS.emerald;
  const mark = mono ? "#FFFFFF" : COLORS.mint;
  const accent = mono ? "#FFFFFF" : COLORS.emerald;
  return (
    <>
      <circle cx="256" cy="256" r="148" fill="none" stroke={ring} strokeWidth="36" strokeLinecap="round" strokeDasharray="860 50" transform="rotate(-100 256 256)" />
      <path fill={mark} d="M232 168h48v184h-48z" />
      <path fill={accent} d="M200 148h112v40H200z" />
      <circle cx="256" cy="378" r="28" fill={accent} />
    </>
  );
}

/** B — Weg zur Klarheit: Konvergierende Linien zu einem Punkt */
function MarkB({ mono }: { mono?: boolean }) {
  const line = mono ? "#FFFFFF" : COLORS.mint;
  const dot = mono ? "#FFFFFF" : COLORS.emerald;
  return (
    <>
      <path stroke={line} strokeWidth="32" strokeLinecap="round" fill="none" d="M108 392 L256 168" />
      <path stroke={line} strokeWidth="32" strokeLinecap="round" fill="none" d="M404 392 L256 168" />
      <circle cx="256" cy="148" r="32" fill={dot} />
      <path stroke={BG} strokeWidth="8" strokeLinecap="round" d="M256 180v48" />
    </>
  );
}

/** C — Weiterwirken: Form setzt sich in der nächsten fort */
function MarkC({ mono }: { mono?: boolean }) {
  const a = mono ? "#FFFFFF" : COLORS.mint;
  const b = mono ? "#FFFFFF" : COLORS.emerald;
  return (
    <>
      <rect x="120" y="176" width="148" height="148" rx="28" fill={a} opacity={mono ? 1 : 0.95} />
      <rect x="244" y="176" width="148" height="148" rx="28" fill={b} opacity={mono ? 0.7 : 0.9} />
      <rect x="320" y="212" width="120" height="76" rx="20" fill={a} />
    </>
  );
}

const MARKS: Record<LogoVariantId, typeof MarkA> = { A: MarkA, B: MarkB, C: MarkC };

export const LOGO_VARIANT_META: Record<
  LogoVariantId,
  { id: LogoVariantId; name: string; meaning: string }
> = {
  A: { id: "A", name: "Entscheidungs-Siegel", meaning: "Bewusst entschieden und festgehalten" },
  B: { id: "B", name: "Weg zur Klarheit", meaning: "Orientierung und nächster Schritt" },
  C: { id: "C", name: "Weiterwirken", meaning: "Verantwortung und Wirkung über den Moment hinaus" },
};

/** Provisional production choice — Entscheidungs-Siegel (best fit for „Mein Wille“) */
export const PROVISIONAL_LOGO_VARIANT: LogoVariantId = "A";

export function LogoCandidateMark({
  variant,
  size = 40,
  className,
  mono,
  darkBg = true,
}: {
  variant: LogoVariantId;
  size?: number;
  className?: string;
  mono?: boolean;
  darkBg?: boolean;
}) {
  const Mark = MARKS[variant];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("rounded-xl shrink-0", className)}
      aria-hidden
    >
      <rect width="512" height="512" rx="96" fill={darkBg && !mono ? BG : mono ? "#101828" : "#FFFFFF"} />
      <Mark mono={mono} />
    </svg>
  );
}
