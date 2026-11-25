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
      areaIds={["tod-sterben", "vorsorge"]}
    />
  );
}
