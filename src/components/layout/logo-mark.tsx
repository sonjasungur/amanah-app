import { LogoCandidateMark, PROVISIONAL_LOGO_VARIANT } from "@/components/layout/logo-candidates";
import { cn } from "@/lib/utils/cn";

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <LogoCandidateMark
      variant={PROVISIONAL_LOGO_VARIANT}
      size={size}
      className={cn(className)}
      darkBg
    />
  );
}
