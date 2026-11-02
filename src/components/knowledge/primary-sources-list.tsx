import { PrimarySourceCard } from "@/components/ui/primary-source-card";
import { getPrimarySourcesByIds, QURAN_ATTRIBUTION } from "@/lib/knowledge/sources";
import { groupedReferenceLabel } from "@/lib/knowledge/source-dedup";

/** Server component: reads the sources here and hands only the shown ones to the browser. */
export function PrimarySourcesList({
  sourceIds,
  title = "Qur'an und authentische Sunnah",
  defaultCollapsed = true,
}: {
  sourceIds: string[];
  title?: string;
  defaultCollapsed?: boolean;
}) {
  const sources = getPrimarySourcesByIds(sourceIds);
  if (sources.length === 0) return null;
  const groupedRefs = groupedReferenceLabel(sources);
  const autoOpen = !defaultCollapsed && sources.length <= 2;

  return (
    <div className="space-y-3">
      {title ? <h4 className="text-base font-bold text-primary-dark">{title}</h4> : null}
      {sources.map((s) => (
        <PrimarySourceCard
          key={s.id}
          source={s}
          defaultOpen={autoOpen}
          groupedRefs={s.sourceGroup ? groupedRefs : null}
          quranAttribution={QURAN_ATTRIBUTION}
        />
      ))}
    </div>
  );
}
