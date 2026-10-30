import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";

export const metadata = {
  title: "Testament & Erbe — Mein Wille",
  description: "Islamisches Erbrecht: Farāʾiḍ, Waṣiyya und deutsches Recht für Muslime in Deutschland.",
};

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function TestamentErbePage() {
  return (
    <GatedAreaPage
      eyebrow={"Wissen & Orientierung"}
      title={"Testament & Erbe"}
      intro={"Islamisches Erbrecht und deutsches Recht — getrennt erklärt, mit geprüften Quellen."}
      areaIds={["faraid", "islam-und-recht"]}
    />
  );
}
