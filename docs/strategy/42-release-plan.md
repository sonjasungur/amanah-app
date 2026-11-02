# Plan für das reguläre Release (Stand 02.11.2026)

**Für:** Owner, Prüfer, Betrieb. **Stand:** Feature-Branch `feat/vorsorge-testament-foundation`; Produktion läuft auf `7d0859b` mit Hotfix ([Doku 41](41-hotfix-wissenssperre-produktion.md)), Route geschlossen, 0 Konten.

Kein Punkt dieses Plans ist freigegeben. Commit, Staging, Migration, Deployment und jede Veröffentlichung brauchen je eine eigene Owner-Freigabe.

## Übersicht

| # | Anforderung | Stand | Offen |
|---|---|---|---|
| 1 | Registrierung nur mit bestätigter E-Mail | **im Code fertig und getestet** | Mailversand, Absender, Domain |
| 2 | Datenverlust-Korrekturen | **im Branch** (`a42eda9`, `4bf33d8`) | Ausrollen mit dem Release |
| 3 | Netztrennung zu `gemeinsam1` | **vorbereitet** (Doku 41 §6) | Freigabe, später eigenes Proxy-Netz |
| 4 | Ungeprüfte Modultexte | **erfasst** (18 Stellen) | Entscheidung, Umsetzung, Prüfung |
| 5 | Hydrationsfehler #418 | **lokal behoben** | Commit-Freigabe |
| 6 | Testablauf mit isolierter Datenbank | **vorbereitet** (`scripts/testing/release-check.sh`) | Lauf auf dem Staging-Server |
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

Enthalten im Branch: keine Abmeldung bei abgebrochener Anfrage, Eingaben während des Ladens bleiben, offene Änderungen gehen beim Verlassen hinaus. Lokal, noch nicht committet: Der nächste Seitenaufbau lädt offene Änderungen verlässlich hoch. Tests: `auth-session-hint`, `storage-sync`, `e2e/plus-tariff-account`.

**Zum Release gehört eine Produktionsmigration:** Die Produktion hat 1 von 6 Migrationen. Alle 5 weiteren sind laut Doku additiv, einzeln prüfen. Bei 0 Konten ist das Risiko gering. Vorher Backup, Trockenlauf auf einer Kopie, gesonderte Freigabe.

## 3. Netztrennung

**Jetzt:** Die gepinnte Datei (Doku 41 §6) löst die App vom Netz `gemeinsam1-prod_internal`. Die Route ist geschlossen, nichts braucht die Verbindung.

**Beim Release mit öffentlicher Route:**
1. Eigenes Netz `amanah_prod_proxy` anlegen, App und nur den Proxy anschließen. App erreicht dann weder Datenbank noch Backend von `gemeinsam1`.
2. Der Proxy-Container gehört zum `gemeinsam1`-Stack. Das Anschließen und ein neuer Caddy-Block sind deshalb eine eigene Freigabe, `gemeinsam1` selbst ändert sich nicht.
3. Da Caddy jeden Host auf jeder TLS-Verbindung bedient, gilt: Route erst setzen, wenn die Domain steht und die App freigabereif ist. Nach dem Reload erneut alle Wege aus Doku 41 §1 prüfen.

## 4. Ungeprüfte Modultexte hinter der Anmeldung

Erfasst durch Durchsicht des Codes, Stichprobe gegen die Dateien bestätigt. Keine Stelle liegt hinter einer Inhaltssperre.

**Klare Aussagen (10):**

| Fundstelle | Aussage | Art |
|---|---|---|
| `src/app/dashboard/pdf/page.tsx:99` | eigenhändiges Testament vollständig handschriftlich | Recht |
| `src/components/print/print-views.tsx:70` | von Hand geschrieben und unterschrieben, § 2247 BGB | Recht |
| `src/components/print/print-views.tsx:71` | Vollmacht und Patientenverfügung brauchen eigene Dokumente | Recht |
| `src/lib/vorsorge/documents.ts:6` | Original für Bank und Behörden | Recht |
| `src/lib/vorsorge/documents.ts:8` | eigenhändig oder notariell, amtliche Verwahrung | Recht |
| `src/lib/vorsorge/documents.ts:9` | für Sterbeurkunde und Überführung | Recht |
| `src/lib/export/family-letter-template.ts:40` | „darf für mich entscheiden (Dokument liegt im Ordner)“, ohne Prüfung, ob es existiert | Recht |
| `src/app/dashboard/schulden-amanah/page.tsx:56` | Zakat und Versprechen, die vor dem Tod erledigt werden sollten | Religion |
| `src/lib/export/family-letter-template.ts:48` | islamische Grundsätze, zeitnahe Janazah, Ghusl und Kafan | Religion |
| `src/lib/export/family-letter-template.ts:53` | fachlich klären, bevor der Nachlass verteilt wird | Religion, Recht |

**Grenzfälle (8):** `translations.ts:237`, `:270` („im zulässigen Rahmen“), `print-views.tsx:161` („Allah entscheidet“), `vollmacht/page.tsx:10`, `betreuung/page.tsx:10`, `sadaqa-jariya/page.tsx:10`, `question-plan.ts:182`, `familiengespraech/topics.ts:66`.

**Nicht vollständig durchgesehen:** `module-form.tsx`, `consent-gate.tsx`, `use-guided-flow.ts`, `answer-parser.ts` (nur Stichworte), `storage-controls.tsx`, gesperrte Inhalte, andere Sprachen als Deutsch und Englisch. Vorlage an Prüfer erst nach vollständiger Durchsicht.

**Vorschlag:**
- Die 10 klaren Aussagen neutral formulieren oder hinter einen Schalter `modulfachtexte` legen, Standard aus. Beispiel: „Formvorschriften mit Anwalt oder Notar klären“.
- Die Vorlage für den Familienbrief nennt religiöse Wünsche als Vorgabe; dort Platzhalter statt vorformulierter Überzeugungen.
- § 2247 BGB im Ausdruck fachlich prüfen lassen und bis dahin neutral halten.

**Nicht umgesetzt:** Das ändert Inhalte, die Nutzer sehen, und braucht deine Entscheidung. Aufwand gering.

## 5. Hydrationsfehler #418: behoben

**Ursache:** `StorageModeBanner`, `StorageControls`, `SaveStatusIndicator`, `DashboardStatusCard` und `/dashboard/einstellungen` lasen beim ersten Rendern den Sitzungshinweis aus `localStorage`. Der Server rendert „lokal“, der Browser „Konto“.

**Fix:** `src/lib/storage/use-storage-label.ts` liefert beim ersten Rendern den Serverwert und danach den echten. Test: `e2e/hydration-session.spec.ts` (mit Sitzungshinweis, schlägt ohne Fix fehl).

Im Produktionsstand besteht der Fehler weiter und ist nicht sicherheitsrelevant; er verschwindet mit dem Release.

## 6. Testablauf

`scripts/testing/release-check.sh` führt alles aus, was bisher von Hand lief: Typen, Lint, Unit, PostgreSQL, Migrations-Diff, API-Regression, Hydration, Konto, Verlauf, Plus, Restore-Übung, alle Builds, Flags, Playwright, Secret-Scan. Jeder Schritt hat ein Timeout und ein Log; steht ein Log 5 Minuten still, wird der Prozessstatus festgehalten. Die Datenbank ist ein Wegwerf-Container im RAM.

**Auf dem Staging-Server (nach Freigabe):** wie beim Hotfix-Test eine eigene Instanz neben dem bestehenden Staging, eigene Datenbank, eigenes Netz, nur lokal erreichbar. Danach Migration von 1 auf 6 auf einer Kopie mit synthetischen Daten. Keine Produktions- oder Staging-Daten.

## 7. Smartphone

Siehe [Doku 43](43-smartphone-abnahme.md).

## 8. Verbindliche Freigaben

`docs/release/freigaben.json` listet Datenschutz, Recht, Religion, Medizin, Nutzungsrechte und Smartphone. `node scripts/validate-release.mjs --mode=public-release` scheitert, solange eine fehlt oder Prüfer, Datum oder Dokument leer sind. Bestandene Tests ersetzen keine Freigabe; nur der Owner trägt Ergebnisse ein.

**Grenzen:** Die Datei kann bearbeitet werden, sie ist eine Absprache mit Prüfung und kein Schutz gegen Absicht. Der Prüfer läuft nicht automatisch beim Deployment; das sollte Teil der Deployment-Anleitung werden.

## Vorgeschlagene Reihenfolge

1. Owner: Commit dieses Stands, Absicherung Doku 41 §6.
2. Owner: Entscheidung zu §4, danach neutral formulieren.
3. Prüfer beauftragen (Doku 40 §4, §4 oben), Domain und Mail (§1).
4. Release-Prüfung und Staging-Lauf (§6).
5. Smartphone-Abnahme (§7).
6. Migration und Deployment, jeweils mit Freigabe.
7. Route und Registrierung zuletzt, jeweils mit Freigabe.
