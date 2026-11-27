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
      image="testament"
      actions={[
        { href: "/dashboard/testament", label: "Testament und Erbe", text: "Hinweise und Fragen, die du mit Notar oder Kanzlei klären kannst." },
        { href: "/dashboard/vermoegen", label: "Vermögensübersicht", text: "Konten, Versicherungen und Immobilien geordnet aufschreiben." },
        { href: "/dashboard/schulden-amanah", label: "Schulden und Amanah", text: "Was du schuldest, verliehen hast oder anvertraut bekommen hast." },
      ]}
      areaIds={["faraid", "islam-und-recht"]}
    />
  );
}
