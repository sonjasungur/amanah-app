import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/sadaqa-jariya");

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function SadaqaJariyaPage() {
  return (
    <GatedAreaPage
      eyebrow={"Islamische Vorsorge"}
      title={"Sadaqa Jariya"}
      intro={"Islamisches Wissen zu fortwirkender Wohltätigkeit und wohltätigen Vermächtnissen — veröffentlicht erst nach fachlicher Prüfung."}
      areaIds={["vorsorge"]}
      cta={{ href: "/dashboard/sadaqa-jariya", label: "Eigene Sadaqa-Jariya-Wünsche im Ordner festhalten" }}
    />
  );
}
