import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Bestatter — Mein Wille",
  description: "Hinweis zum Bestatter-Verzeichnis. Derzeit keine geprüften Partnereinträge.",
};

export default function BestatterPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Hinweis</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Islamische Bestatter</h1>
        <p className="text-muted leading-relaxed">
          Ein öffentliches Verzeichnis erscheint hier erst, wenn echte, geprüfte Partner vorliegen.
          Derzeit gibt es keine Einträge und keine Verifizierungen.
        </p>
      </div>

      <div
        className="rounded-2xl border border-border bg-card p-8 text-center"
        data-testid="bestatter-empty-state"
      >
        <p className="text-foreground font-semibold mb-2">Noch keine geprüften Bestatter</p>
        <p className="text-sm text-muted leading-relaxed">
          Bitte wende dich im akuten Fall an eine Moschee, einen Imam oder einen islamischen Bestattungsdienst
          in deiner Region. Wir erfinden keine Anbieter, Telefonnummern oder Websites.
        </p>
      </div>

      <div className="mt-10">
        <Disclaimer />
      </div>
    </div>
  );
}
