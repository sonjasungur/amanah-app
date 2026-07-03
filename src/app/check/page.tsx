import { AmanahCheck } from "@/components/check/amanah-check";
import { Disclaimer } from "@/components/ui/disclaimer";

export const metadata = { title: "Amanah-Check — AmanahOrdner" };

export default function CheckPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-primary text-center mb-3">Kostenloser Amanah-Check</h1>
      <p className="text-center text-muted mb-8">10 Fragen — ehrlich beantworten, um deinen Vorbereitungsstand zu sehen.</p>
      <AmanahCheck />
      <div className="mt-8"><Disclaimer /></div>
    </div>
  );
}
