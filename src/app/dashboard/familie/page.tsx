"use client";

import { useState } from "react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { buildFamilyLetterTemplate } from "@/lib/export/family-letter-template";
import { getAiConsent } from "@/lib/ai/consent-client";
import { ModulePage } from "@/components/modules/module-page";
import { familyFields } from "@/lib/modules/fields";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { isAiUiEnabled } from "@/lib/ai/config";
import { FileText, Mail, Sparkles } from "lucide-react";
import type { FamilyMessageTone } from "@/lib/ai/types";

const tones: { id: FamilyMessageTone; label: string }[] = [
  { id: "liebevoll", label: "Liebevoll" },
  { id: "sachlich", label: "Sachlich" },
  { id: "kurz", label: "Kurz" },
  { id: "ausfuehrlich", label: "Ausführlich" },
];

export default function FamiliePage() {
  const store = useAmanahStore();
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<FamilyMessageTone>("liebevoll");
  const [consentMissing, setConsentMissing] = useState(false);

  const generateTemplateLetter = () => {
    const letter = buildFamilyLetterTemplate(pickDataFields(store));
    store.updateField("familyMessage", {
      ...store.familyMessage,
      familyLetter: letter,
    });
  };

  const generateWithAi = async () => {
    if (!isAiUiEnabled()) return;
    const consentGranted = getAiConsent() === "granted";
    if (!consentGranted) {
      setConsentMissing(true);
      return;
    }
    setConsentMissing(false);
    setLoading(true);
    try {
      const res = await fetch("/api/ai/family-message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          data: pickDataFields(store),
          tone,
          consentGranted,
        }),
      });
      const data = await res.json();
      if (data.message) {
        store.updateField("familyMessage", {
          ...store.familyMessage,
          familyLetter: data.message,
        });
      } else if (res.status === 403 || data?.requiresConsent) {
        setConsentMissing(true);
      }
    } catch {
      generateTemplateLetter();
    }
    setLoading(false);
  };

  const copyLetter = async () => {
    if (store.familyMessage.familyLetter) {
      await navigator.clipboard.writeText(store.familyMessage.familyLetter);
    }
  };

  return (
    <ModulePage
      title="Familienbrief"
      description="Bereite Brief, WhatsApp-Nachricht und Gesprächsleitfaden vor — getrennt vom Gespräch mit Angehörigen."
      section="familyMessage"
      fields={familyFields}
    >
      <Card className="mt-6 bg-gradient-to-br from-accent/10 to-primary/5 border-accent/30 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-primary flex items-center gap-2">
          <Mail size={20} className="text-accent" />
          Brief an meine Familie vorbereiten
        </h3>
        <p className="text-sm text-muted">
          Ohne KI funktioniert ein vollständiger Template-Brief aus deinen Ordner-Daten.
          Mit KI kann der Text später schöner formuliert werden — immer als Entwurf, keine Rechtsberatung.
        </p>
        {consentMissing && (
          <div
            className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground"
            data-testid="family-ai-consent-required"
            role="alert"
          >
            Für die KI-Verfeinerung ist zuerst eine ausdrückliche Einwilligung nötig.
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <Button onClick={generateTemplateLetter} variant="primary">
            <FileText size={16} className="mr-2" /> Template-Brief erstellen
          </Button>
          {isAiUiEnabled() && (
          <div className="flex items-center gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as FamilyMessageTone)}
              className="text-sm border border-primary/20 rounded-lg px-3 py-2 bg-card"
            >
              {tones.map((t) => (
                <option key={t.id} value={t.id}>{t.label}</option>
              ))}
            </select>
            <Button onClick={generateWithAi} disabled={loading} variant="secondary">
              <Sparkles size={16} className="mr-2" />
              {loading ? "Wird erstellt…" : "Mit Assistent verfeinern"}
            </Button>
          </div>
          )}
        </div>
        {store.familyMessage.familyLetter && (
          <Button variant="outline" size="sm" onClick={copyLetter}>
            Brief in Zwischenablage kopieren
          </Button>
        )}
      </Card>
    </ModulePage>
  );
}
