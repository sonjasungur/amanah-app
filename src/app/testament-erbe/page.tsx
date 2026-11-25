import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/testament-erbe");

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function TestamentErbePage() {
  return (
    <GatedAreaPage
      eyebrow={"Wissen & Orientierung"}
      title={"Testament & Erbe"}
      intro={"Islamisches Erbrecht und deutsches Recht — getrennt erklärt, veröffentlicht erst nach fachlicher und juristischer Prüfung."}
      areaIds={["faraid", "islam-und-recht"]}
    />
  );
}
