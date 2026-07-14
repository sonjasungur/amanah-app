import Link from "next/link";
import {
  LOGO_VARIANT_META,
  LogoCandidateMark,
  type LogoVariantId,
} from "@/components/layout/logo-candidates";
import { BRAND } from "@/lib/brand";

const SIZES = [16, 24, 32, 48, 64, 128] as const;
const VARIANTS: LogoVariantId[] = ["A", "B", "C"];

function Wordmark({ light }: { light?: boolean }) {
  return (
    <span className={cnWordmark(light)}>
      <span className={light ? "text-white/75 font-semibold" : "text-muted font-semibold"}>Mein </span>
      <span className={light ? "text-emerald font-bold" : "text-primary font-bold"}>Wille</span>
    </span>
  );
}

function cnWordmark(light?: boolean) {
  return `font-bold text-xl ${light ? "text-white" : "text-foreground"}`;
}

export default function BrandReviewPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-10 pb-20">
      <p className="text-sm font-semibold uppercase tracking-widest text-primary mb-2">Intern — nur lokal</p>
      <h1 className="text-page-title font-bold text-foreground mb-2">Logo-Vergleich</h1>
      <p className="text-body-lg text-muted max-w-2xl mb-10">
        Drei buchstabenfreie Markensymbole zur visuellen Abnahme. Vorläufig aktiv: Variante{" "}
        <strong className="text-primary">A — Entscheidungs-Siegel</strong> im Header.
      </p>

      <div className="space-y-16">
        {VARIANTS.map((id) => {
          const meta = LOGO_VARIANT_META[id];
          return (
            <section key={id} className="rounded-2xl border border-border overflow-hidden">
              <div className="bg-accent-soft px-6 py-4 border-b border-border">
                <h2 className="text-section-title font-bold text-foreground">
                  Variante {id}: {meta.name}
                </h2>
                <p className="text-muted mt-1">{meta.meaning}</p>
              </div>

              <div className="grid md:grid-cols-2">
                <div className="p-8 bg-card border-b md:border-b-0 md:border-r border-border">
                  <p className="text-sm font-semibold text-muted mb-6 uppercase tracking-wide">Hell</p>
                  <div className="flex items-center gap-4 mb-8">
                    <LogoCandidateMark variant={id} size={64} darkBg={false} />
                    <Wordmark />
                  </div>
                  <div className="flex flex-wrap items-end gap-6">
                    {SIZES.map((s) => (
                      <div key={s} className="text-center">
                        <LogoCandidateMark variant={id} size={s} darkBg={false} />
                        <p className="text-xs text-muted mt-2">{s}px</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-8 bg-navy">
                  <p className="text-sm font-semibold text-emerald mb-6 uppercase tracking-wide">Dunkel</p>
                  <div className="flex items-center gap-4 mb-8">
                    <LogoCandidateMark variant={id} size={64} />
                    <Wordmark light />
                  </div>
                  <div className="flex flex-wrap items-end gap-6">
                    {SIZES.map((s) => (
                      <div key={s} className="text-center">
                        <LogoCandidateMark variant={id} size={s} />
                        <p className="text-xs text-white/60 mt-2">{s}px</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 bg-background border-t border-border flex flex-wrap gap-4 items-center">
                <p className="text-sm text-muted">App-Icon (128px):</p>
                <LogoCandidateMark variant={id} size={128} />
                <LogoCandidateMark variant={id} size={128} mono />
                <span className="text-xs text-muted">+ monochrom</span>
              </div>
            </section>
          );
        })}
      </div>

      <p className="mt-10 text-muted text-sm">
        <Link href="/" className="text-primary hover:underline">
          ← Zurück zur Startseite
        </Link>
        {" · "}
        {BRAND.name} — keine Icons in public/ bis zur finalen Freigabe.
      </p>
    </div>
  );
}
