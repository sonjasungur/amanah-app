import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";

export const metadata = {
  title: "Islam oder Kultur? — Mein Wille",
  description: "Unterscheide islamische Pflichten von kulturellen Gewohnheiten bei Janazah und Trauer.",
};

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function IslamOderKulturPage() {
  return (
    <GatedAreaPage
      eyebrow={"Kulturfilter"}
      title={"Islam oder Kultur?"}
      intro={"Was ist islamisch belegt, was kulturelle Gewohnheit? Antworten erscheinen hier erst nach fachlicher Prüfung der Quellen."}
      areaIds={["tod-sterben", "janazah"]}
    />
  );
}
