# Plan für das reguläre Release (Stand 02.11.2026)

**Für:** Owner, Prüfer, Betrieb. **Stand 03.11.:** Kandidat `8668188` auf Staging geprüft: [Testnachweis](../release/testnachweis-kandidat.md), [Produktionsplan](../release/produktionsplan.md), [Checkliste](../release/RELEASE-CHECKLISTE.md). Feature-Branch `feat/vorsorge-testament-foundation`; Produktion läuft auf `7d0859b` mit Hotfix, gepinnt und vom `gemeinsam1`-Netz getrennt ([Doku 41](41-hotfix-wissenssperre-produktion.md)), Route geschlossen, 0 Konten.

Kein Punkt dieses Plans ist freigegeben. Commit, Staging, Migration, Deployment und jede Veröffentlichung brauchen je eine eigene Owner-Freigabe.

## Übersicht

| # | Anforderung | Stand | Offen |
|---|---|---|---|
| 1 | Registrierung nur mit bestätigter E-Mail | **im Code fertig und getestet** | Mailversand, Absender, Domain ([Doku 44](44-domain-und-mail-aktivierung.md)) |
| 2 | Datenverlust-Korrekturen | **im Branch** (`a42eda9`, `4bf33d8`) | Ausrollen mit dem Release |
| 3 | Netztrennung zu `gemeinsam1` | **in Produktion umgesetzt** (Doku 41 §6) | beim Release eigenes Proxy-Netz |
| 4 | Ungeprüfte Modultexte | **lokal gesperrt** (Owner-Entscheidung) | Fachprüfung |
| 5 | Hydrationsfehler #418 | **im Branch behoben** | Ausrollen |
| 6 | Testablauf mit isolierter Datenbank | **erledigt** (`scripts/testing/release-check.sh`, Staging, Probelauf) | wiederholen bei neuem Commit |
| 7 | Smartphone-Abnahme | **vorbereitet** ([Doku 43](43-smartphone-abnahme.md)) | Durchführung durch den Owner |
| 8 | Externe Freigaben verbindlich | **umgesetzt** (`docs/release/freigaben.json`) | Alle 6 Freigaben stehen aus |

## 1. Registrierung nur mit bestätigter E-Mail

**Vorhanden:** Registrierung ohne Sitzung, Bestätigungsmail, Anmeldung erst danach (`email_unverified`), Token-Prüfung, Regel für Altkonten (`src/lib/server/email-verification.ts`). Registrierung standardmäßig aus (`AMANAH_PUBLIC_REGISTRATION_ENABLED=false`). Getestet in `security-session` und `phase2-failure-paths`.

**Der Produktionsstand hat das nicht:** `7d0859b` registriert ohne Bestätigung. Das Release ersetzt ihn.

**Offen:**
1. Domain und Absender festlegen (Owner, Doku 33).
2. Mailanbieter in Betrieb nehmen: SPF, DKIM, DMARC. Heute `AMANAH_MAIL_TRANSPORT=disabled`, Versand ist gesperrt.
3. Zustellung mit echtem Postfach prüfen, erst danach Registrierung einschalten.

**Ohne funktionierenden Mailversand bleibt die Registrierung aus**, sonst käme niemand ins Konto.

## 2. Datenverlust-Korrekturen

Enthalten im Branch: keine Abmeldung bei abgebrochener Anfrage, Eingaben während des Ladens bleiben, offene Änderungen gehen beim Verlassen hinaus. Der nächste Seitenaufbau lädt offene Änderungen verlässlich hoch, auch große Ordner über 64 KB. Mehrere Runden auf beiden Profilen bestanden. Tests: `auth-session-hint`, `storage-sync`, `e2e/plus-tariff-account`.

**Zum Release gehört eine Produktionsmigration:** Die Produktion hat 1 von 6 Migrationen. Bei 0 Konten ist das Risiko gering. Vorher Backup, Probelauf (§6), gesonderte Freigabe.

## 3. Netztrennung

**Erledigt:** Die App hängt nur noch im eigenen Netz, `gemeinsam1`-Dienste sind aus ihr nicht auflösbar.

**Beim Release mit öffentlicher Route:**
1. Eigenes Netz `amanah_prod_proxy` anlegen, App und nur den Proxy anschließen. App erreicht dann weder Datenbank noch Backend von `gemeinsam1`.
2. Der Proxy-Container gehört zum `gemeinsam1`-Stack. Das Anschließen und ein neuer Caddy-Block sind deshalb eine eigene Freigabe, `gemeinsam1` selbst ändert sich nicht.
3. Da Caddy jeden Host auf jeder TLS-Verbindung bedient, gilt: Route erst setzen, wenn die Domain steht und die App freigabereif ist. Nach dem Reload erneut alle Wege aus Doku 41 §1 prüfen.

## 4. Ungeprüfte Modultexte hinter der Anmeldung

**Owner-Entscheidung 02.11.2026, lokal umgesetzt, nicht in Produktion:** Zentrale Sperre in `src/lib/content/module-texts.ts`. Sie enthält nur neutrale Texte und eine Freigabestufe, die Prüfer, Datum und Dokument verlangt. Die Originale liegen wortgetreu in [`docs/release/gesperrte-modultexte.md`](../release/gesperrte-modultexte.md), außerhalb von `src/`.

| Gruppe | Anzahl | Umgang |
|---|---|---|
| Klare Aussagen | 10, dazu die Fundstelle in `testament/vorbereitung` | gesperrt, neutral ersetzt |
| Grenzfälle | 8, jeweils einzeln begründet im Archiv | vorsorglich alle gesperrt |
| Neutrale Organisationshinweise | | sichtbar, ohne Prüfbehauptung |

Der Hinweis „kein Testament“ und „keine rechtliche Wirkung“ bleibt: Er ist eine Schutzaussage über das Produkt. Die Abläufe bleiben vollständig: Der Familienbrief enthält Platzhalter statt Überzeugungen, die Dokumentenliste behält Hinweise. Test: `src/__tests__/module-text-lock.test.ts`.

**Noch nicht bewertet:** Inhalte in `demo-data.ts`, Sprachen außer Deutsch und Englisch; `module-form.tsx`, `consent-gate.tsx`, `use-guided-flow.ts`, `answer-parser.ts`, `storage-controls.tsx` nur per Stichwortsuche.

**Zum Release:** Die Produktion enthält die Originaltexte noch; sie sind dort nur nach Anmeldung sichtbar, und die Route ist geschlossen. Sie verschwinden mit dem Release.

## 5. Hydrationsfehler #418: behoben

**Ursache:** `StorageModeBanner`, `StorageControls`, `SaveStatusIndicator`, `DashboardStatusCard` und `/dashboard/einstellungen` lasen beim ersten Rendern den Sitzungshinweis aus `localStorage`. Der Server rendert „lokal“, der Browser „Konto“.

**Fix:** `src/lib/storage/use-storage-label.ts` liefert beim ersten Rendern den Serverwert und danach den echten. Test: `e2e/hydration-session.spec.ts` (mit Sitzungshinweis, schlägt ohne Fix fehl).

Im Produktionsstand besteht der Fehler weiter und ist nicht sicherheitsrelevant; er verschwindet mit dem Release.

## 6. Testablauf

`scripts/testing/release-check.sh` führt alles aus, was bisher von Hand lief: Typen, Lint, Unit, PostgreSQL, Migrations-Diff, API-Regression, Hydration, Konto, Verlauf, Plus, Restore-Übung, alle Builds, Flags, Playwright, Secret-Scan. Jeder Schritt hat ein Timeout und ein Log; steht ein Log 5 Minuten still, wird der Prozessstatus festgehalten. Die Datenbank ist ein Wegwerf-Container im RAM.

**Migrations-Probelauf:** `scripts/testing/migration-rehearsal.sh` startet bei der einen Migration der Produktion, legt ein synthetisches Konto an und spielt alle 6 ein. Konto und Ordner bleiben, die Altkonto-Regel greift, das Schema passt. Keine der 5 Migrationen enthält zerstörende Befehle laut Stichwortsuche. Bestanden, lokal.

**Isolierte Staging-Prüfung, am 03.11.2026 durchgeführt (Ergebnis: Doku 45 §4, Produktionsplan):**

1. `df -h /` auf dem Server; Build lokal, Übertragung mit Prüfsumme wie beim Hotfix.
2. Eigene Instanz neben dem bestehenden Staging: eigener Name, eigene Datenbank im RAM, eigenes internes Netz, nur `127.0.0.1`, Speicher und CPU begrenzt.
3. Schema mit den Migrationen des Juli-Stands anlegen, synthetische Konten, dann `prisma migrate deploy` des Releases.
4. Über SSH-Tunnel: Wissenssperre mit Textproben, Modultext-Sperre, Registrierung mit Outbox, Plus-Sandbox, Konto, Reload und Verlassen, Löschen, Export.
5. Rollback-Probe auf den Hotfix mit gesichertem Datenbankstand; Migrationen sind nicht automatisch umkehrbar, also Restore prüfen.
6. Instanz vollständig entfernen; bestehendes Staging und seine Datenbank bleiben unberührt.

Das bestehende Staging läuft nach Owner-Auftrag vom 03.11. ebenfalls auf dem Kandidaten.

## 7. Smartphone

Siehe [Doku 43](43-smartphone-abnahme.md).

## 8. Verbindliche Freigaben

`docs/release/freigaben.json` listet Datenschutz, Recht, Religion, Medizin, Nutzungsrechte und Smartphone. `node scripts/validate-release.mjs --mode=public-release` scheitert, solange eine fehlt oder Prüfer, Datum oder Dokument leer sind. Bestandene Tests ersetzen keine Freigabe; nur der Owner trägt Ergebnisse ein.

**Grenzen:** Die Datei kann bearbeitet werden, sie ist eine Absprache mit Prüfung und kein Schutz gegen Absicht. Der Prüfer läuft nicht automatisch beim Deployment; das sollte Teil der Deployment-Anleitung werden.

## Vorgeschlagene Reihenfolge

1. Owner: Commit des lokalen Stands.
2. Owner: Prüfer beauftragen (Doku 40 §4, `gesperrte-modultexte.md`).
3. Owner: Marke, Domain, Mailanbieter ([Doku 44](44-domain-und-mail-aktivierung.md)). Agenten legen nichts davon fest.
4. Staging-Prüfung (§6), Smartphone-Abnahme (§7).
5. Migration und Deployment, jeweils mit Freigabe; neuer Digest in der gepinnten Datei.
6. Route und Registrierung zuletzt, jeweils mit Freigabe.
