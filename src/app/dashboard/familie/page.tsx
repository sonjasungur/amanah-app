"use client";

import { useState } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { ModulePage } from "@/components/modules/module-page";
import { familyFields } from "@/lib/modules/fields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export default function FamiliePage() {
  const store = useAmanahStore();
  const [loading, setLoading] = useState(false);

  const generateFamilyLetter = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: "Erstelle einen einfühlsamen Familienbrief auf Deutsch basierend auf meinen AmanahOrdner-Daten. Erkläre meine wichtigsten Wünsche für Krankheit, Janazah, Testament und Barzakh in verständlicher Sprache für meine Familie. Keine Rechts- oder Fatwa-Beratung.",
          }],
          context: { amanahData: store, action: "family_letter" },
        }),
      });
      const data = await res.json();
      if (data.response) {
        store.updateField("familyMessage", {
          ...store.familyMessage,
          familyLetter: data.response,
        });
      }
    } catch {
      alert("Fehler beim Generieren. Bitte versuche es erneut.");
    }
    setLoading(false);
  };

  return (
    <ModulePage
      title="Familiengespräch"
      description="Bereite Brief, WhatsApp-Nachricht und Gesprächsleitfaden vor — damit deine Familie informiert ist."
      section="familyMessage"
      fields={familyFields}
    >
      <Card className="mt-6 bg-gradient-to-br from-accent/5 to-primary/5 border-accent/20">
        <h3 className="text-lg font-semibold text-primary mb-2 flex items-center gap-2">
          <Sparkles size={20} className="text-accent" />
          Familienbrief generieren
        </h3>
        <p className="text-sm text-muted mb-4">
          Der Assistent erstellt einen Entwurf basierend auf deinen bisherigen Angaben. Bitte persönlich anpassen und mit Imam/Anwalt besprechen, wo nötig.
        </p>
        <Button onClick={generateFamilyLetter} disabled={loading} variant="secondary">
          {loading ? "Wird erstellt..." : "Familienbrief mit KI erstellen"}
        </Button>
      </Card>
    </ModulePage>
  );
}
