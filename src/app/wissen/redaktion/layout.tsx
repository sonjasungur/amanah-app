import { EditorialNav } from "@/components/knowledge/editorial-nav";
import { isEditorialPreviewEnabled } from "@/lib/flags/knowledge-preview";

/** Shared navigation for all editorial pages; nothing is shown where the editorial preview is off. */
export const dynamic = "force-dynamic";

export default function EditorialLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {isEditorialPreviewEnabled() && <EditorialNav />}
      {children}
    </>
  );
}
