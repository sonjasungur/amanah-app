"use client";

import Link from "next/link";
import { Disclaimer } from "@/components/ui/disclaimer";
import { AlertTriangle } from "lucide-react";
import { DigitalLegacyEditor } from "@/components/vorsorge/digital-legacy-editor";
import { HelpTip } from "@/components/ui/help-tip";
import { SaveBar } from "@/components/storage/save-bar";
import { Button } from "@/components/ui/button";
import { useAmanahStore } from "@/lib/store/use-amanah-store";
import { isSecretLike } from "@/lib/validation/secret-like";
import { digitalEntryFromHint } from "@/lib/vorsorge/digital-legacy";

/** D-26: a text from the old power-of-attorney field "Digitale Konten" can become an entry here. It stays there until deleted. */
function FromPowerOfAttorney() {
  const { powerOfAttorney, digitalLegacy, updateSections } = useAmanahStore();
  const old = powerOfAttorney.digitalAccounts?.trim() ?? "";
  if (!old) return null;
  const taken = digitalLegacy.some((d) => (d.provider?.name ?? d.description).trim() === old);
  if (taken) return null;
  const secret = isSecretLike(old);
  return (
    <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm mb-6" data-testid="digital-from-poa">
      <p className="font-medium">Früher in der Vorsorgevollmacht eingetragen</p>
      {secret ? (
        <p className="mt-1 text-danger" role="alert">
          Der Text dort sieht nach Zugangsdaten oder einer Nummer aus und wird deshalb nicht übernommen. Bitte prüfe ihn in der{" "}
          <Link href="/dashboard/vollmacht" className="underline">Vorsorgevollmacht</Link> und lösche ihn dort.
        </p>
      ) : (
        <>
          <p className="mt-1 text-muted whitespace-pre-line">{old}</p>
          <Button
            size="sm"
            variant="outline"
            className="mt-2"
            data-testid="digital-take-from-poa"
            onClick={() => updateSections({ digitalLegacy: [...useAmanahStore.getState().digitalLegacy, digitalEntryFromHint(crypto.randomUUID(), old)] })}
          >
            Als Eintrag übernehmen
          </Button>
          <p className="mt-1 text-xs text-muted">Der Text bleibt in der Vollmacht unter „Früher eingetragen“, bis du ihn dort löschst.</p>
        </>
      )}
    </div>
  );
}

export default function DigitalerNachlassPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-primary mb-2 flex flex-wrap items-center">Digitaler Nachlass <HelpTip topic="digitaler-nachlass" /></h1>
      <p className="text-muted mb-6">
        Halte je Konto fest, was damit geschehen soll, wer sich kümmert und wie deine Familie sicher herankommt — ohne Passwörter.
      </p>
      <Disclaimer className="mb-4" />

      <div className="rounded-xl bg-danger/5 border border-danger/20 px-4 py-3 text-sm mb-6 flex items-start gap-3">
        <AlertTriangle size={20} className="text-danger shrink-0 mt-0.5" />
        <div>
          <p className="font-medium text-danger">Keine Passwörter speichern!</p>
          <p className="text-muted mt-1">
            Trage nur ein, wo deine Familie sicher herankommt (z. B. Notfallzugang im Passwort-Manager, versiegelter Brief). Passwörter, PINs,
            IBAN und lange Nummern werden erkannt und nicht gespeichert.
          </p>
        </div>
      </div>

      <FromPowerOfAttorney />
      <DigitalLegacyEditor />
      <SaveBar />
    </div>
  );
}
