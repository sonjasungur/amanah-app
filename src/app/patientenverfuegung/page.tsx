import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";
import { publicPageMetadata } from "@/lib/seo/public-pages";

export const metadata = publicPageMetadata("/patientenverfuegung");

/** Legal, medical and religious statements appear only through the knowledge-centre publication gate. */
export default function PatientenverfuegungPage() {
  return (
    <GatedAreaPage
      eyebrow={"Medizinische Vorsorge"}
      title={"Patientenverfügung"}
      intro={"Wissen zu Patientenverfügung und Vorsorgevollmacht — veröffentlicht erst nach fachlicher Prüfung. Für deine Fragen sind Arzt, Anwalt oder Notar und in religiösen Fragen Imam oder Gelehrte die richtigen Ansprechpartner."}
      areaIds={["vorsorge"]}
      cta={{ href: "/dashboard/krankheit", label: "Eigene Wünsche im Ordner festhalten" }}
    />
  );
}
