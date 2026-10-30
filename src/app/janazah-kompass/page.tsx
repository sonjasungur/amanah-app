import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";

export const metadata = {
  title: "Janazah-Kompass — Mein Wille",
  description: "Islamisches Wissen zu Janazah, Ghusl, Kafan und Bestattung in Deutschland.",
};

/** Religious content is shown only through the knowledge-centre publication gate. */
export default function JanazahKompassPage() {
  return (
    <GatedAreaPage
      eyebrow={"Wissen & Orientierung"}
      title={"Janazah-Kompass"}
      intro={"Islamisches Wissen zu Janazah, Ghusl, Kafan und Bestattung — veröffentlicht erst nach fachlicher Prüfung."}
      areaIds={["janazah", "tod-sterben"]}
      cta={{ href: "/dashboard/janazah", label: "Eigene Janazah-Wünsche im Ordner festhalten" }}
    />
  );
}
