import {
  WISSEN_CATEGORIES,
  WISSEN_CATEGORY_CONFIG,
  topicCountForCategory,
  type WissenCategoryId,
} from "@/lib/knowledge/wissen-categories";
import { cn } from "@/lib/utils/cn";
import { Activity, HeartPulse, Scale, Sparkles } from "lucide-react";

const ICONS: Record<WissenCategoryId, typeof HeartPulse> = {
  notfall: HeartPulse,
  janazah: Activity,
  vermoegen: Scale,
  akhira: Sparkles,
};

export function WissenCategoryTiles({
  active,
  onSelect,
}: {
  active: WissenCategoryId | "all";
  onSelect: (id: WissenCategoryId | "all") => void;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
      {WISSEN_CATEGORIES.map((id) => {
        const cat = WISSEN_CATEGORY_CONFIG[id];
        const Icon = ICONS[id];
        const selected = active === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onSelect(id)}
            className={cn(
              "text-left rounded-2xl border-2 p-5 min-h-[44px] transition-all",
              selected ? "border-transparent shadow-md scale-[1.02]" : "border-border bg-card hover:border-primary/30"
            )}
            style={
              selected
                ? { backgroundColor: `${cat.accent}12`, borderColor: cat.accent }
                : undefined
            }
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-3 [&_svg]:text-[var(--cat-accent)]"
              style={{ backgroundColor: `${cat.accent}20`, ["--cat-accent" as string]: cat.accent }}
            >
              <Icon size={22} aria-hidden />
            </div>
            <h3 className="font-bold text-foreground text-base leading-snug">{cat.label}</h3>
            <p className="text-sm text-muted mt-1">{topicCountForCategory(id)} Themen</p>
          </button>
        );
      })}
    </div>
  );
}
