import { ContactForm } from "@/components/contact/contact-form";
import { IMPRINT } from "@/lib/legal/imprint";

export const metadata = {
  title: "Kontakt — Wasiyya",
  description: "Schreib uns: Fragen zu Wasiyya, zu deinem Konto oder zur Zusammenarbeit.",
};

export default function KontaktPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12" data-testid="contact-page">
      <h1 className="text-3xl font-bold text-primary mb-3">Kontakt</h1>
      <p className="text-body text-muted mb-8">
        Schreib uns, wenn du eine Frage zu Wasiyya oder zu deinem Konto hast oder einen Fehler gefunden hast. Wir beraten nicht
        in rechtlichen, medizinischen oder religiösen Einzelfragen.
      </p>
      <ContactForm />
      <p className="text-sm text-muted mt-10">
        Du kannst uns auch direkt schreiben:{" "}
        <a href={`mailto:${IMPRINT.email}`} className="text-primary font-semibold hover:underline">
          {IMPRINT.email}
        </a>
      </p>
    </div>
  );
}
