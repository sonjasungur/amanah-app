import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/islam-oder-kultur");

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function IslamOderKulturPage() {
  return (
    <GatedAreaPage
      eyebrow={"Kulturfilter"}
      title={"Islam oder Kultur?"}
      intro={"Was ist islamisch belegt, was kulturelle Gewohnheit? Antworten erscheinen hier erst nach fachlicher Prüfung der Quellen."}
      image="janazah"
      actions={[
        { href: "/dashboard/familiengespraech", label: "Familiengespräch", text: "Festhalten, worüber ihr gesprochen habt und was noch offen ist." },
        { href: "/dashboard/janazah", label: "Janazah-Wünsche", text: "Deine eigenen Wünsche klar aufschreiben." },
      ]}
      areaIds={["tod-sterben", "janazah"]}
    />
  );
}
