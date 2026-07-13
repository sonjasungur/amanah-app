import { BestatterDirectory } from "./bestatter-directory";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = {
  title: "Bestatter-Verzeichnis — Amanah Vorsorge",
  description: "Islamische Bestatter in Deutschland — Ghusl, Kafan, Janazah und Überführung.",
};

export default function BestatterPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-10">
        <p className="text-accent font-medium mb-2">Notfall & Vorsorge</p>
        <h1 className="text-3xl font-bold text-primary mb-3">Islamische Bestatter</h1>
        <p className="text-muted leading-relaxed">
          Finde islamische Bestattungsdienste in deiner Region. Im akuten Todesfall zählt jede Minute —
          speichere deinen bevorzugten Bestatter schon vorher im Amanah Vorsorge.
        </p>
      </div>

      <BestatterDirectory />

      <div className="mt-10">
        <Disclaimer />
      </div>
    </div>
  );
}
