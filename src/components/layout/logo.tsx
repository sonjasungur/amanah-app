import Link from "next/link";
import { cn } from "@/lib/utils/cn";
import { BRAND } from "@/lib/brand";

/** Dark-green rounded square with a light folded document. No letters, arch, seal, or gravestone. */
export function DocumentLogoMark({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={cn("shrink-0", className)}
      aria-hidden
      data-testid="document-logo-mark"
    >
      <rect width="64" height="64" rx="14" fill="#075E3B" />
      <path fill="#F4F7F6" d="M18 13h21l11 11v27a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4V17a4 4 0 0 1 4-4z" />
      <path fill="#C5D4CF" d="M39 13v9.5c0 .8.7 1.5 1.5 1.5H51" />
      <path fill="#E8F7F0" d="M39 13l12 11h-10.5A1.5 1.5 0 0 1 39 22.5V13z" />
      <rect x="22" y="34" width="20" height="2.4" rx="1.2" fill="#075E3B" opacity="0.35" />
      <rect x="22" y="40" width="16" height="2.4" rx="1.2" fill="#075E3B" opacity="0.28" />
      <rect x="22" y="46" width="12" height="2.4" rx="1.2" fill="#075E3B" opacity="0.22" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <Link
      href="/"
      className={cn("inline-flex items-center gap-2.5 min-h-[44px] min-w-0 group", className)}
      aria-label={`${BRAND.name} — Startseite`}
    >
      <DocumentLogoMark size={40} />
      <span className="font-bold text-[clamp(1.125rem,2.5vw,1.375rem)] leading-none tracking-tight truncate">
        <span className={cn("font-semibold", light ? "text-white/85" : "text-foreground")}>Mein </span>
        <span className={cn(light ? "text-emerald" : "text-primary")}>Wille</span>
      </span>
    </Link>
  );
}
