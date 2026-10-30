import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";

export const metadata = {
  title: "Barzakh — Mein Wille",
  description: "Was ist Barzakh? Orientierung zu Sadaqa Jariya, Schulden und dem Leben nach dem Tod.",
};

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
