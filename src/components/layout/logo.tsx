import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

type LogoVariant = "header" | "hero";
type LogoTone = "default" | "light";

const sizes: Record<LogoVariant, number> = { header: 40, hero: 72 };

export function Logo({ variant = "header", tone = "default", className }: { variant?: LogoVariant; tone?: LogoTone; className?: string }) {
  const size = sizes[variant];
  const light = tone === "light";
  return (
    <Link href="/" className={cn("flex items-center gap-3 group", className)}>
      <Image
        src="/icon.svg"
        alt=""
        width={size}
        height={size}
        className="rounded-2xl shadow-md ring-1 ring-accent/30 shrink-0"
        priority={variant === "header"}
      />
      <div className="leading-tight">
        <span className={cn("font-bold group-hover:text-accent transition-colors", variant === "hero" ? "text-2xl" : "text-lg", light ? "text-white" : "text-primary")}>
          AmanahOrdner
        </span>
        <span className={cn("block tracking-wide uppercase", variant === "hero" ? "text-xs" : "text-[10px]", light ? "text-white/70" : "text-muted")}>
          Amanah ordnen · Bewusst vorbereiten
        </span>
      </div>
    </Link>
  );
}
