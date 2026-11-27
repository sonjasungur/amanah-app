import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/barzakh");

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function BarzakhPage() {
  return (
    <GatedAreaPage
      eyebrow={"Wissen & Orientierung"}
      title={"Barzakh"}
      intro={"Islamisches Wissen zur Zeit nach dem Tod — veröffentlicht erst nach fachlicher Prüfung."}
      image="licht"
      actions={[
        { href: "/dashboard/barzakh", label: "Barzakh-Vorbereitung", text: "Was du für die Zeit nach dem Tod vorbereiten möchtest." },
        { href: "/dashboard/schulden-amanah", label: "Schulden und Amanah", text: "Offene Schulden und anvertraute Dinge, damit nichts offen bleibt." },
        { href: "/dashboard/sadaqa-jariya", label: "Sadaqa Jariya", text: "Gutes, das nach dir weiterwirkt." },
      ]}
      areaIds={["tod-sterben", "vorsorge"]}
    />
  );
}
