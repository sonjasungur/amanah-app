"use client";

import { useState } from "react";

/**
 * AP22 EA-03.2: clickable mock-up of the future partner platform (concept ap19/partnerbereich-konzept.html,
 * ARCHITEKTUR-PARTNERPLATTFORM.md). Static: every profile is fictitious, no form is sent, nothing is stored, the
 * postcode is not processed. Notaries: no list and no profiles, only the official notary search (§ 14 Abs. 4 BNotO).
 */

type Group = "bestatter" | "anwalt" | "notar";
type View = "suche" | "registrierung" | "profil" | "pruefung";

const GROUPS: { id: Group; label: string }[] = [
  { id: "bestatter", label: "Bestatter" },
  { id: "anwalt", label: "Rechtsanwälte (Erbrecht)" },
  { id: "notar", label: "Notare" },
];

const RULES: Record<Group, string[]> = {
  bestatter: ["Ergebnisliste nur nach Entfernung sortiert", "Bezahlte Platzierung nur sichtbar als „Anzeige“", "Keine Provision je Bestattung"],
  anwalt: ["Keine Empfehlung durch Wasiyya", "Keine Gebühr je Anfrage oder Mandat (§ 49b Abs. 3 BRAO)", "Zulassung und Fachanwaltstitel werden geprüft"],
  notar: ["Keine Notarliste, keine Partnernotare, keine Termine (§ 14 Abs. 4 BNotO)", "Freie Notarwahl über die amtliche Notarsuche", "Keine Einnahmen von Notaren"],
};

/** Fictitious examples only: no real firm names, no phone numbers, no addresses. */
const PROFILES: { group: Exclude<Group, "notar">; name: string; place: string; km: number; tags: string[]; checked: boolean; ad?: boolean }[] = [
  { group: "bestatter", name: "Bestattungshaus Beispiel A", place: "Beispielstadt-Mitte", km: 3, tags: ["Ghusl", "Überführung ins Ausland", "24 Stunden erreichbar"], checked: true, ad: true },
  { group: "bestatter", name: "Bestattungshaus Beispiel B", place: "Beispielstadt-Nord", km: 12, tags: ["Ghusl", "Türkisch, Arabisch"], checked: true },
  { group: "bestatter", name: "Bestattungshaus Beispiel C", place: "Nachbarort (Beispiel)", km: 38, tags: ["Ghusl"], checked: false },
  { group: "anwalt", name: "Kanzlei Beispiel D", place: "Beispielstadt-Mitte", km: 1, tags: ["Fachanwalt für Erbrecht", "Auslandsvermögen", "Video-Beratung"], checked: true },
  { group: "anwalt", name: "Kanzlei Beispiel E", place: "Kreisstadt (Beispiel)", km: 44, tags: ["Fachanwalt für Erbrecht", "Arabisch"], checked: true },
];

const QUEUE = [
  ["Rechtsanwälte", "Kanzlei Beispiel E", "Neues Profil", "Fachanwaltstitel", "wartet"],
  ["Bestatter", "Bestattungshaus Beispiel C", "Neueintrag", "Gewerbeanmeldung fehlt", "Nachweis fehlt"],
  ["Bestatter", "Bestattungshaus Beispiel B", "Sprachen ergänzt", "–", "freigegeben"],
] as const;

const VIEWS: { id: View; label: string }[] = [
  { id: "suche", label: "Suche" },
  { id: "registrierung", label: "Partner werden" },
  { id: "profil", label: "Profil verwalten" },
  { id: "pruefung", label: "Prüfung (intern)" },
];

function Fictitious() {
  return <span className="rounded-full border border-[#7E5812]/40 bg-[#F6EFD9] px-2 py-0.5 text-xs font-semibold text-[#7E5812]">Beispiel, fiktiv</span>;
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl border border-[#D4A537]/50 bg-[#F6EFD9] px-4 py-3 text-sm text-[#0E1630]" role="status" data-testid="partner-preview-note">
      {children}
    </p>
  );
}

const field = "mt-1 w-full min-h-[44px] rounded-xl border border-[#E2E6EF] bg-white px-3 text-[#0E1630]";

export function PartnerPlatformPreview() {
  const [view, setView] = useState<View>("suche");
  const [group, setGroup] = useState<Group>("bestatter");
  const [radius, setRadius] = useState(25);
  const [plz, setPlz] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const results = PROFILES.filter((p) => p.group === group && p.km <= radius).sort((a, b) => a.km - b.km);
  const ads = results.filter((p) => p.ad);

  const mock = (text: string) => (e?: React.FormEvent) => {
    e?.preventDefault();
    setNotice(text);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 text-[#0E1630]" data-testid="partner-platform-preview">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7E5812]">Partnerplattform · Vorschau</p>
      <h1 className="wz-serif text-3xl sm:text-4xl text-[#142048] mt-2">Die richtigen Ansprechpartner für deine Vorsorge</h1>
      <p className="mt-3 max-w-2xl text-[#48516F]">
        So könnte die künftige Plattform für Bestatter und Rechtsanwälte aussehen. Notare werden nicht gelistet. Alle Einträge sind erfunden; nichts wird
        gesendet oder gespeichert.
      </p>

      <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Ansichten">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            type="button"
            role="tab"
            aria-selected={view === v.id}
            onClick={() => {
              setView(v.id);
              setNotice(null);
            }}
            className={`min-h-[44px] rounded-full px-4 text-sm font-semibold border ${view === v.id ? "bg-[#142048] text-white border-[#142048]" : "bg-white text-[#142048] border-[#E2E6EF] hover:border-[#D4A537]"}`}
          >
            {v.label}
          </button>
        ))}
      </div>

      {notice && <div className="mt-5"><Note>{notice}</Note></div>}

      {view === "suche" && (
        <section className="mt-6 space-y-5" aria-label="Suche" data-testid="partner-search">
          <div className="flex flex-wrap gap-2" role="group" aria-label="Partnergruppe">
            {GROUPS.map((g) => (
              <button
                key={g.id}
                type="button"
                aria-pressed={group === g.id}
                onClick={() => setGroup(g.id)}
                className={`min-h-[44px] rounded-full px-4 text-sm font-semibold border ${group === g.id ? "bg-[#D4A537] text-[#0B1226] border-[#D4A537]" : "bg-white text-[#142048] border-[#E2E6EF]"}`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {group === "notar" ? (
            <div className="rounded-2xl border border-[#E2E6EF] bg-white p-5 sm:p-6 space-y-3" data-testid="partner-notary">
              <h2 className="wz-serif text-2xl text-[#142048]">Notare findest du über die amtliche Notarsuche</h2>
              <p className="text-[#48516F]">
                Wasiyya führt keine Notarliste, nennt keine Notare und vereinbart keine Termine. So bleiben freie Notarwahl und notarielle Unabhängigkeit gewahrt.
                Du bekommst die Vorbereitung für deinen Termin.
              </p>
              <a href="https://www.notar.de/" target="_blank" rel="noreferrer noopener" className="inline-flex min-h-[44px] items-center rounded-full bg-[#142048] px-5 font-semibold text-white">
                Amtliche Notarsuche öffnen (notar.de)
              </a>
              <p className="text-xs text-[#48516F]">Rechtliche Prüfung offen: ob selbst dieser Hinweis zulässig ist.</p>
            </div>
          ) : (
            <>
              <form className="grid gap-3 sm:grid-cols-[1fr_12rem_auto] items-end" onSubmit={mock("Vorschau: Die Postleitzahl wird nicht verarbeitet und nicht gespeichert. Die Entfernungen der Beispiele sind erfunden.")}>
                <label className="text-sm font-semibold">
                  PLZ oder Ort
                  <input className={field} inputMode="numeric" autoComplete="off" value={plz} onChange={(e) => setPlz(e.target.value)} placeholder="z. B. 12345" />
                </label>
                <label className="text-sm font-semibold">
                  Umkreis
                  <select className={field} value={radius} onChange={(e) => setRadius(Number(e.target.value))}>
                    <option value={10}>10 km</option>
                    <option value={25}>25 km</option>
                    <option value={50}>50 km</option>
                  </select>
                </label>
                <button type="submit" className="min-h-[44px] rounded-full bg-[#142048] px-5 font-semibold text-white">
                  Suchen
                </button>
              </form>
              <p className="text-sm text-[#48516F]">Sortiert nur nach Entfernung. Bezahlte Tarife ändern diese Reihenfolge nicht.</p>
              {ads.length > 0 && group === "bestatter" && (
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#7E5812]">Anzeige · bezahlte Platzierung (Beispiel)</p>
              )}
              <ul className="space-y-3" data-testid="partner-results">
                {results.map((p) => (
                  <li key={p.name} className={`rounded-2xl border bg-white p-4 sm:p-5 flex flex-wrap items-start justify-between gap-3 ${p.ad && group === "bestatter" ? "border-[#D4A537]" : "border-[#E2E6EF]"}`} data-testid="partner-result">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-semibold text-[#142048]">
                        {p.name} <Fictitious />
                      </p>
                      <p className="text-sm text-[#48516F]">{p.place}</p>
                      <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-semibold ${p.checked ? "bg-[#E6F2EA] text-[#1E5B35]" : "bg-[#F6EFD9] text-[#7E5812]"}`}>{p.checked ? "Angaben geprüft (Beispiel)" : "Prüfung läuft (Beispiel)"}</span>
                        {p.tags.map((t) => (
                          <span key={t} className="rounded-full border border-[#E2E6EF] px-2 py-0.5 text-[#48516F]">
                            {t}
                          </span>
                        ))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold">{p.km} km</p>
                      <button type="button" onClick={mock(`Vorschau: Kontakt zu „${p.name}“ ist eine Attrappe. Ohne deine Freigabe geht nichts aus deinem Ordner mit.`)} className="mt-2 min-h-[40px] rounded-full border border-[#142048] px-4 text-sm font-semibold text-[#142048]">
                        Kontakt
                      </button>
                    </div>
                  </li>
                ))}
                {results.length === 0 && <li className="rounded-2xl border border-[#E2E6EF] bg-white p-4 text-sm text-[#48516F]">Keine Beispiele im Umkreis. Vergrößere den Umkreis.</li>}
              </ul>
            </>
          )}
          <div className="rounded-2xl border border-[#E2E6EF] bg-white p-4 text-sm">
            <p className="font-semibold text-[#142048]">Was in dieser Gruppe gilt</p>
            <ul className="mt-2 list-disc pl-5 text-[#48516F] space-y-1">
              {RULES[group].map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {view === "registrierung" && (
        <section className="mt-6 rounded-2xl border border-[#E2E6EF] bg-white p-5 sm:p-6 space-y-4" aria-label="Partner werden" data-testid="partner-register">
          <h2 className="wz-serif text-2xl text-[#142048]">Partner werden (Attrappe)</h2>
          <p className="text-[#48516F]">Eine Registrierung für Bestatter und Rechtsanwälte. Notare können sich nicht registrieren. Nach der Registrierung folgt die Prüfung der Nachweise.</p>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={mock("Vorschau: Es wurde nichts gesendet und nichts gespeichert.")}>
            <label className="text-sm font-semibold">
              Partnergruppe
              <select className={field} defaultValue="bestatter">
                <option value="bestatter">Bestatter</option>
                <option value="anwalt">Rechtsanwalt / Kanzlei</option>
              </select>
            </label>
            <label className="text-sm font-semibold">
              Name des Betriebs oder der Kanzlei
              <input className={field} autoComplete="off" placeholder="Beispiel" />
            </label>
            <label className="text-sm font-semibold">
              Ort
              <input className={field} autoComplete="off" placeholder="Beispielstadt" />
            </label>
            <label className="text-sm font-semibold">
              Nachweis (z. B. Gewerbeanmeldung, Zulassung)
              <input className={field} disabled placeholder="Hochladen in der Vorschau nicht möglich" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="min-h-[44px] rounded-full bg-[#142048] px-5 font-semibold text-white">
                Registrierung absenden (Vorschau)
              </button>
            </div>
          </form>
        </section>
      )}

      {view === "profil" && (
        <section className="mt-6 rounded-2xl border border-[#E2E6EF] bg-white p-5 sm:p-6 space-y-4" aria-label="Profil verwalten" data-testid="partner-profile">
          <h2 className="wz-serif text-2xl text-[#142048] flex flex-wrap items-center gap-2">
            Kanzlei Beispiel D <Fictitious />
          </h2>
          <p className="text-[#48516F]">Partner pflegen ihr Profil selbst. Jede Änderung wird geprüft; öffentlich bleibt bis dahin die bisherige Fassung.</p>
          <form className="grid gap-3 sm:grid-cols-2" onSubmit={mock("Vorschau: Die Änderung wurde nicht gesendet und nicht gespeichert.")}>
            <label className="text-sm font-semibold">
              Schwerpunkte
              <input className={field} defaultValue="Erbrecht, Auslandsvermögen" />
            </label>
            <label className="text-sm font-semibold">
              Sprachen
              <input className={field} defaultValue="Deutsch, Arabisch" />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" className="min-h-[44px] rounded-full bg-[#142048] px-5 font-semibold text-white">
                Zur Prüfung senden (Vorschau)
              </button>
            </div>
          </form>
          <p className="text-sm text-[#48516F]">Partner sehen keine Vorsorgeordner und keine Konten. Ein Datenblatt sehen sie nur, wenn eine Person es ihnen selbst freigibt.</p>
        </section>
      )}

      {view === "pruefung" && (
        <section className="mt-6 rounded-2xl border border-[#E2E6EF] bg-white p-5 sm:p-6 space-y-3 overflow-x-auto" aria-label="Prüfung" data-testid="partner-review-queue">
          <h2 className="wz-serif text-2xl text-[#142048]">Prüfung und Freigabe (interne Ansicht, Beispiel)</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[#48516F]">
                <th className="py-2 pr-3">Gruppe</th>
                <th className="py-2 pr-3">Partner</th>
                <th className="py-2 pr-3">Vorgang</th>
                <th className="py-2 pr-3">Nachweis</th>
                <th className="py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {QUEUE.map((q) => (
                <tr key={q[1]} className="border-t border-[#E2E6EF]">
                  {q.map((c, i) => (
                    <td key={i} className="py-2 pr-3">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="text-xs text-[#48516F]">Alle Einträge fiktiv.</p>
        </section>
      )}
    </div>
  );
}
