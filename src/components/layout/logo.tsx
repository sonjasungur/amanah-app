import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center min-h-[44px] min-w-0 group", className)}
      aria-label={`${BRAND.name} — Startseite`}
    >
      <span className="font-bold text-[clamp(1.125rem,2.5vw,1.375rem)] leading-none tracking-tight truncate">
        <span className={cn("font-semibold", light ? "text-white/85" : "text-foreground")}>Mein </span>
        <span className={cn(light ? "text-emerald" : "text-primary")}>Wille</span>
      </span>
    </Link>
  );
}
