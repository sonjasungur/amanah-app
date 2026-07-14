"use client";

import { cn } from "@/lib/utils/cn";
import { WISSEN_SIDEBAR_ITEMS, type WissenNavSection } from "@/lib/knowledge/wissen-hub";

export function WissenSidebar({
  active,
  onSelect,
  className,
}: {
  active: WissenNavSection;
  onSelect: (sectionId: string, navId: WissenNavSection) => void;
  className?: string;
}) {
  return (
    <nav className={cn("space-y-1", className)} aria-label="Wissensnavigation">
      {WISSEN_SIDEBAR_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect(item.sectionId, item.id)}
          className={cn(
            "w-full text-left px-4 py-3 rounded-xl text-[15px] font-semibold min-h-[44px] transition-colors",
            active === item.id
              ? "bg-accent-soft text-primary"
              : "text-muted hover:bg-background hover:text-foreground"
          )}
          aria-current={active === item.id ? "true" : undefined}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

export function WissenMobileFilter({
  active,
  onSelect,
}: {
  active: WissenNavSection;
  onSelect: (sectionId: string, navId: WissenNavSection) => void;
}) {
  return (
    <div className="lg:hidden mb-6 -mx-1 overflow-x-auto pb-2">
      <div className="flex gap-2 px-1 min-w-max">
        {WISSEN_SIDEBAR_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelect(item.sectionId, item.id)}
            className={cn(
              "px-4 py-2.5 rounded-full text-sm font-semibold border min-h-[44px] whitespace-nowrap",
              active === item.id
                ? "bg-primary text-white border-primary"
                : "bg-card border-border text-muted"
            )}
            aria-current={active === item.id ? "true" : undefined}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}
