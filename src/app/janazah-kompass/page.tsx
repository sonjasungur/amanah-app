import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/janazah-kompass");

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function JanazahKompassPage() {
  return (
    <GatedAreaPage
      eyebrow={"Wissen & Orientierung"}
      title={"Janazah-Kompass"}
      intro={"Islamisches Wissen zu Janazah, Ghusl, Kafan und Bestattung — veröffentlicht erst nach fachlicher Prüfung."}
      image="janazahKompass"
      actions={[
        { href: "/dashboard/janazah", label: "Janazah-Wünsche", text: "Gebet, Ort und Wünsche für die Beisetzung festhalten." },
        { href: "/dashboard/ghusl-kafan", label: "Ghusl und Kafan", text: "Wer die Waschung übernehmen soll und was dir wichtig ist." },
        { href: "/dashboard/bestattung", label: "Bestattung oder Überführung", text: "Beisetzung in Deutschland oder Überführung, Kontakte und Unterlagen." },
      ]}
      areaIds={["janazah", "tod-sterben"]}
    />
  );
}
