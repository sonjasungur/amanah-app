import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * On "Islamisches Wissen" (/wissen), only while the knowledge centre preview is switched on: the way into
 * the preview. Staging and production never show it (the switch is off there).
 */
export function KnowledgeCentrePreviewEntry() {
  return (
    <div className="wz border-b border-[var(--wz-line)]" data-testid="centre-preview-entry">
      <div className="mx-auto max-w-5xl px-5 py-6 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex-1 min-w-0">
          <p className="wz-eyebrow">Vorschau · nicht veröffentlicht</p>
          <p className="wz-serif mt-1 text-xl font-semibold text-[var(--wz-green)]">Das neue Islamische Wissenszentrum</p>
          <p className="text-[0.975rem] text-[var(--wz-muted)]">Einstieg „Was passiert, wenn ich in Deutschland nichts geregelt habe?“, sechs Rubriken und der Musterartikel zu Āl ʿImrān 3:185.</p>
        </div>
        <Link href="/wissen/zentrum" className="wz-button wz-button-primary shrink-0">
          Zur Vorschau <ArrowRight size={18} aria-hidden />
        </Link>
      </div>
    </div>
  );
}
