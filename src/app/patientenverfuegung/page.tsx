import { GatedAreaPage } from "@/components/islamic-knowledge/gated-area-page";

export const metadata = {
  title: "Patientenverfügung — Mein Wille",
  description: "Wünsche zur medizinischen Vorsorge festhalten. Wissensartikel erscheinen erst nach fachlicher Prüfung.",
};

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
