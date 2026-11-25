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
      image="licht"
      actions={[
        { href: "/dashboard/sadaqa-jariya", label: "Sadaqa Jariya", text: "Was nach dir weiterwirken soll – Projekte und Wünsche." },
        { href: "/dashboard/familie", label: "Familienbrief", text: "Persönliche Worte und Bitten an deine Familie." },
      ]}
      areaIds={["vorsorge"]}
    />
  );
}
