"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const STEPS = [
  { href: "/dashboard/janazah", label: "Persönliche Wünsche", shortLabel: "Wünsche" },
  { href: "/dashboard/ghusl-kafan", label: "Ghusl & Kafan", shortLabel: "Ghusl" },
  { href: "/dashboard/bestattung", label: "Beisetzung", shortLabel: "Beisetzung" },
] as const;

export function JanazahModuleNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Janazah-Bereiche"
      className="mb-6 rounded-2xl border border-border bg-card p-2 shadow-sm"
      data-testid="janazah-module-nav"
    >
      <ol className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {STEPS.map((step, index) => {
          const active = pathname === step.href;
          return (
            <li key={step.href}>
              <Link
                href={step.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 min-h-[44px] text-sm font-semibold transition-colors",
                  active
                    ? "bg-accent-soft text-primary-dark ring-2 ring-primary/25"
                    : "text-muted hover:bg-accent-soft/60 hover:text-primary-dark"
                )}
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                    active ? "bg-primary text-white" : "bg-border text-muted"
                  )}
                  aria-hidden
                >
                  {index + 1}
                </span>
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
