"use client";

import { Disclaimer } from "@/components/ui/disclaimer";
import { AlertTriangle } from "lucide-react";
import { DigitalLegacyEditor } from "@/components/vorsorge/digital-legacy-editor";
import { HelpTip } from "@/components/ui/help-tip";
import { SaveBar } from "@/components/storage/save-bar";

export default function DigitalerNachlassPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2 flex flex-wrap items-center">Digitaler Nachlass <HelpTip topic="digitaler-nachlass" /></h1>
      <p className="text-muted mb-6">
        Dokumentiere Hinweise zu digitalen Konten und Dateien — ohne Passwörter zu speichern.
      </p>
      <Disclaimer className="mb-4" />

      <div className="rounded-xl bg-danger/5 border border-danger/20 px-4 py-3 text-sm mb-6 flex items-start gap-3">
        <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-danger">Keine Passwörter speichern!</p>
          <p className="text-muted mt-1">
            Trage nur Hinweise ein, wo Zugangsdaten sicher aufbewahrt werden (z. B. Passwort-Manager, versiegelter Brief).
            Speichere niemals echte Passwörter in diesem Tool.
          </p>
        </div>
      </div>

      <DigitalLegacyEditor />
      <SaveBar />
    </div>
  );
}
