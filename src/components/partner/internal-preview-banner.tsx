import type { ReactNode } from "react";

/** Always visible on the partner previews (AP22 EA-03.1/03.2): internal, not public, nothing is sent or stored. */
export function InternalPreviewBanner({ children }: { children?: ReactNode }) {
  return (
    <div className="on-dark bg-navy text-white border-b border-[#D4A537]/60" role="note" data-testid="internal-preview-banner">
      <div className="max-w-5xl mx-auto px-4 py-3 text-sm leading-relaxed">
        <p className="font-semibold uppercase tracking-[0.12em] text-xs text-[#F2CF6C]">Interne Vorschau – nicht öffentlich</p>
        {children && <p className="mt-1 text-white/90">{children}</p>}
      </div>
    </div>
  );
}
