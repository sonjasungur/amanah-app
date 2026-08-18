import { DocumentLogoMark } from "@/components/layout/logo";
import { cn } from "@/lib/utils/cn";

export function LogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return <DocumentLogoMark size={size} className={cn(className)} />;
}
