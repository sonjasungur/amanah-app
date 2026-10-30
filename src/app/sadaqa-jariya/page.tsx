import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";

export const metadata = {
  title: "Sadaqa Jariya — Mein Wille",
  description: "Fortlaufende Wohltätigkeit für den Barzakh — Wissen und Projekte über Gemeinsam1 e.V.",
};

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function SadaqaJariyaPage() {
  return (
    <GatedAreaPage
      eyebrow={"Islamische Vorsorge"}
      title={"Sadaqa Jariya"}
      intro={"Islamisches Wissen zu fortwirkender Wohltätigkeit und wohltätigen Vermächtnissen — mit geprüften Quellen."}
      areaIds={["vorsorge"]}
      cta={{ href: "/dashboard/sadaqa-jariya", label: "Eigene Sadaqa-Jariya-Wünsche im Ordner festhalten" }}
    />
  );
}
