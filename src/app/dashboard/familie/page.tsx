"use client";

import { useState } from "react";
import { FileText, Mail, PenLine, RotateCcw, Sparkles } from "lucide-react";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { pickDataFields } from "@/lib/store/store-utils";
import { buildFamilyLetterTemplate } from "@/lib/export/family-letter-template";
import { getAiConsent } from "@/lib/ai/consent-client";
import { isAiUiEnabled } from "@/lib/ai/config";
import type { FamilyMessageTone } from "@/lib/ai/types";
import type { FamilyMessage } from "@/lib/domain/types";
import { LETTER_MIN_CHARS } from "@/lib/documents/model";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { Disclaimer } from "@/components/ui/disclaimer";
import { SaveBar } from "@/components/storage/save-bar";
import { DocumentPanel } from "@/components/documents/document-panel";
import { LetterPhrases } from "@/components/family-letter/letter-phrases";
import { appendPhrase } from "@/lib/family-letter/phrases";

const tones: { id: FamilyMessageTone; label: string }[] = [
  { id: "liebevoll", label: "Liebevoll" },
  { id: "sachlich", label: "Sachlich" },
  { id: "kurz", label: "Kurz" },
  { id: "ausfuehrlich", label: "Ausführlich" },
];

const words = (text: string) => (text.trim() ? text.trim().split(/\s+/).length : 0);

/**
 * "Brief an meine Familie" (P2.6): write, save to the folder, look at it, print it. The letter lives
 * in familyMessage (salutation, body, closing, signature, place). Nothing already written is ever
 * replaced without asking, and a replacement can be undone while the page is open.
 */
export default function FamiliePage() {
  const store = useAmanahStore();
  const fm = store.familyMessage;
  const [loading, setLoading] = useState(false);
  const [tone, setTone] = useState<FamilyMessageTone>("liebevoll");
  const [consentMissing, setConsentMissing] = useState(false);
  const [pending, setPending] = useState<{ text: string; source: string } | null>(null);
  const [undo, setUndo] = useState<string | null>(null);

  const update = (patch: Partial<FamilyMessage>) => {
    const current = useAmanahStore.getState().familyMessage;
    store.updateField("familyMessage", { ...current, ...patch, letterUpdatedAt: new Date().toISOString() });
  };

  /** Replaces the body only when it is empty; otherwise asks first and keeps the old text for undo. */
  const offerBody = (text: string, source: string) => {
    if (!useAmanahStore.getState().familyMessage.familyLetter.trim()) {
      update({ familyLetter: text });
      return;
    }
    setPending({ text, source });
  };

  const confirmReplace = () => {
    if (!pending) return;
    setUndo(useAmanahStore.getState().familyMessage.familyLetter);
    update({ familyLetter: pending.text });
    setPending(null);
  };

  const generateTemplateLetter = () => offerBody(buildFamilyLetterTemplate(pickDataFields(store)), "die Vorlage");

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
        offerBody(data.message, "der Vorschlag des Assistenten");
      } else if (res.status === 403 || data?.requiresConsent) {
        setConsentMissing(true);
      }
    } catch {
      generateTemplateLetter();
    }
    setLoading(false);
  };

  const janazahMessage = store.janazahWishes.messageToFamily?.trim();
  const body = fm.familyLetter ?? "";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-primary mb-2 flex items-center gap-2">
          <Mail size={24} aria-hidden /> Brief an meine Familie
        </h1>
        <p className="text-muted max-w-2xl">
          Schreibe in Ruhe, was deine Familie von dir lesen soll. Der Brief wird in deinem Vorsorgeordner gespeichert und lässt
          sich jederzeit weiter bearbeiten, ansehen, als PDF speichern oder drucken. Persönliche Worte, kein rechtliches Dokument.
        </p>
      </header>

      {janazahMessage && !body.trim() && (
        <Card className="p-4 text-sm" data-testid="letter-from-janazah">
          <p>
            In deinen Janazah-Wünschen steht bereits eine persönliche Nachricht an deine Familie. Sie erscheint im Dokument
            „Janazah-Wünsche“. Möchtest du sie hier als Anfang deines Briefs übernehmen? Sie bleibt dort unverändert.
          </p>
          <Button type="button" size="sm" variant="outline" className="mt-2" onClick={() => update({ familyLetter: janazahMessage })} data-testid="letter-take-janazah">
            Als Anfang übernehmen
          </Button>
        </Card>
      )}

      <Card className="p-5 md:p-8 space-y-5" data-testid="letter-editor">
        <div>
          <label htmlFor="letter-greeting" className="text-sm font-medium block mb-1">
            Anrede
          </label>
          <Input id="letter-greeting" value={fm.letterGreeting ?? ""} onChange={(e) => update({ letterGreeting: e.target.value })} placeholder="Meine Lieben," data-testid="letter-greeting" />
        </div>

        <div>
          <label htmlFor="letter-body" className="text-sm font-medium block mb-1">
            Dein Brief
          </label>
          <p id="letter-body-hint" className="text-xs text-muted mb-2">
            Absätze mit einer Leerzeile trennen. Schreib so, wie du sprichst; es gibt kein richtig oder falsch.
          </p>
          <Textarea
            id="letter-body"
            aria-describedby="letter-body-hint letter-body-count"
            rows={16}
            value={body}
            onChange={(e) => update({ familyLetter: e.target.value })}
            className="w-full rounded-xl border border-border bg-card px-4 py-3 text-base leading-relaxed font-[family-name:var(--font-doc-serif)] focus:outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Was möchtest du deiner Familie sagen?"
            data-testid="letter-body"
          />
          <p id="letter-body-count" className="text-xs text-muted mt-1" aria-live="polite" data-testid="letter-word-count">
            {words(body)} Wörter
            {body.trim() && body.trim().length < LETTER_MIN_CHARS ? " · noch sehr kurz" : ""}
          </p>
          {/* AP22 EA-17.1: optional example sentences; added at the end, never replacing the text. */}
          <div className="mt-3">
            <LetterPhrases onTake={(phrase) => update({ familyLetter: appendPhrase(useAmanahStore.getState().familyMessage.familyLetter ?? "", phrase) })} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label htmlFor="letter-closing" className="text-sm font-medium block mb-1">
              Schlussworte
            </label>
            <Input id="letter-closing" value={fm.letterClosing ?? ""} onChange={(e) => update({ letterClosing: e.target.value })} placeholder="In Liebe" data-testid="letter-closing" />
          </div>
          <div>
            <label htmlFor="letter-signature" className="text-sm font-medium block mb-1">
              Unterschrift (Name)
            </label>
            <Input id="letter-signature" value={fm.letterSignature ?? ""} onChange={(e) => update({ letterSignature: e.target.value })} placeholder="Eure Mutter Amina" data-testid="letter-signature" />
          </div>
          <div>
            <label htmlFor="letter-place" className="text-sm font-medium block mb-1">
              Ort (optional)
            </label>
            <Input id="letter-place" value={fm.letterPlace ?? ""} onChange={(e) => update({ letterPlace: e.target.value })} placeholder="Köln" data-testid="letter-place" />
          </div>
          <label className="flex items-start gap-3 min-h-[44px] text-sm self-end">
            <input type="checkbox" className="mt-1 h-5 w-5" checked={fm.letterBismillah === true} onChange={(e) => update({ letterBismillah: e.target.checked })} data-testid="letter-bismillah" />
            <span>Mit der Basmala beginnen (بسم الله الرحمن الرحيم über der Anrede)</span>
          </label>
        </div>

        {pending && (
          <div className="rounded-xl border border-warning/40 bg-warning/5 p-3 text-sm" role="alertdialog" aria-label="Brieftext ersetzen?" data-testid="letter-replace-confirm">
            <p>Du hast schon einen Brieftext. Soll {pending.source} ihn ersetzen? Du kannst das danach rückgängig machen.</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Button type="button" size="sm" variant="secondary" onClick={confirmReplace} data-testid="letter-replace-yes">
                Ersetzen
              </Button>
              <Button type="button" size="sm" variant="ghost" onClick={() => setPending(null)}>
                Meinen Text behalten
              </Button>
            </div>
          </div>
        )}
        {undo !== null && !pending && (
          <p className="text-sm">
            <Button type="button" size="sm" variant="outline" onClick={() => { update({ familyLetter: undo }); setUndo(null); }} data-testid="letter-undo">
              <RotateCcw size={14} className="mr-1.5" aria-hidden /> Vorherigen Text wiederherstellen
            </Button>
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button type="button" variant="outline" size="sm" onClick={generateTemplateLetter} data-testid="letter-template">
            <FileText size={16} className="mr-2" aria-hidden /> Vorlage einfügen
          </Button>
          {isAiUiEnabled() && (
            <div className="flex items-center gap-2">
              <select value={tone} onChange={(e) => setTone(e.target.value as FamilyMessageTone)} className="text-sm border border-primary/20 rounded-lg px-3 py-2 bg-card" aria-label="Ton">
                {tones.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Button onClick={generateWithAi} disabled={loading} variant="outline" size="sm">
                <Sparkles size={16} className="mr-2" aria-hidden />
                {loading ? "Wird erstellt…" : "Mit Assistent verfeinern"}
              </Button>
            </div>
          )}
          <span className="text-xs text-muted">Eine Vorlage ersetzt deinen Text nur, wenn du es bestätigst.</span>
        </div>
        {consentMissing && (
          <div className="rounded-xl border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-foreground" data-testid="family-ai-consent-required" role="alert">
            Für die KI-Verfeinerung ist zuerst eine ausdrückliche Einwilligung nötig.
          </div>
        )}
      </Card>

      <SaveBar />

      <section aria-labelledby="letter-view-title" className="space-y-3" data-testid="letter-view">
        <h2 id="letter-view-title" className="text-lg font-semibold text-foreground flex items-center gap-2">
          <PenLine size={18} className="text-primary" aria-hidden /> Brief ansehen, als PDF speichern oder drucken
        </h2>
        <DocumentPanel id="familienbrief" previewOpen={false} />
      </section>

      <details className="rounded-2xl border border-border bg-card p-4" data-testid="letter-more">
        <summary className="cursor-pointer font-medium min-h-[44px] flex items-center">Weitere Nachrichten (optional)</summary>
        <div className="space-y-4 mt-3">
          {(
            [
              ["keyWishesSummary", "Meine wichtigsten Wünsche in Kürze (erscheint unter dem Brief)"],
              ["whatsappMessage", "Kurze Nachricht (z. B. für WhatsApp)"],
              ["conversationGuide", "Gesprächsleitfaden für die Familie"],
            ] as const
          ).map(([key, label]) => (
            <div key={key}>
              <label htmlFor={`fm-${key}`} className="text-sm font-medium block mb-1">
                {label}
              </label>
              <Textarea
                id={`fm-${key}`}
                rows={3}
                value={fm[key] ?? ""}
                onChange={(e) => store.updateField("familyMessage", { ...useAmanahStore.getState().familyMessage, [key]: e.target.value })}
                className="w-full rounded-xl border border-border bg-card px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </details>

      <Disclaimer />
    </div>
  );
}
