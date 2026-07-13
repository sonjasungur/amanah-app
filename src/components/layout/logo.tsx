import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";

type LogoVariant = "header" | "hero";
type LogoTone = "default" | "light";

const sizes: Record<LogoVariant, number> = { header: 40, hero: 56 };

export function Logo({ variant = "header", tone = "default", className }: { variant?: LogoVariant; tone?: LogoTone; className?: string }) {
  const size = sizes[variant];
  const light = tone === "light";
  return (
    <Link href="/" className={cn("flex items-center gap-3 group min-h-[44px]", className)} aria-label={`${BRAND.name} — Startseite`}>
      <Image
        src="/icon.svg"
        alt=""
        width={size}
        height={size}
        className="rounded-xl shrink-0"
        priority={variant === "header"}
      />
      <div className="leading-snug min-w-0">
        <span className={cn("font-bold block truncate", variant === "hero" ? "text-xl md:text-2xl" : "text-lg", light ? "text-white" : "text-primary")}>
          {BRAND.name}
        </span>
        <span className={cn("hidden sm:block text-sm", light ? "text-white/75" : "text-muted")}>
          {BRAND.tagline}
        </span>
      </div>
    </Link>
  );
}
