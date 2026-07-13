import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";
import { LogoMark } from "@/components/layout/logo-mark";

type LogoVariant = "header" | "hero";
type LogoTone = "default" | "light";

const sizes: Record<LogoVariant, number> = { header: 40, hero: 48 };

export function Logo({ variant = "header", tone = "default", className }: { variant?: LogoVariant; tone?: LogoTone; className?: string }) {
  const size = sizes[variant];
  const light = tone === "light";
  return (
    <Link href="/" className={cn("flex items-center gap-3 group min-h-[44px]", className)} aria-label={`${BRAND.name} — Startseite`}>
      <LogoMark size={size} />
      <div className="leading-snug min-w-0">
        <span className={cn("block truncate", variant === "hero" ? "text-xl md:text-2xl" : "text-lg", light ? "text-white" : "text-foreground")}>
          <span className={cn("font-semibold", light ? "text-white/90" : "text-muted")}>Mein </span>
          <span className="font-bold">Wille</span>
        </span>
        <span className={cn("hidden sm:block text-sm leading-snug", light ? "text-white/75" : "text-muted")}>
          {BRAND.subtitle}
        </span>
      </div>
    </Link>
  );
}
