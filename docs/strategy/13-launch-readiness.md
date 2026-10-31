# Launch-Readiness – überprüfbare Freigabematrix

Stand: 2026-10-31 (Nachmittag) · Integrationsbranch `feat/vorsorge-testament-foundation` inklusive Prisma 7 · Ziel: **erst privater Pilot (synthetische Daten), dann Start „Vorsorge Plus“ (ohne Testament, ohne Erbquoten)**
Status: TESTED (technisch nachgewiesen) · IMPLEMENTED (ohne vollständigen Nachweis) · TODO · BLOCKED · REQUIRES_OWNER · REQUIRES_LEGAL_REVIEW · REQUIRES_SCHOLAR_REVIEW

Regel: Ein Start ist erst möglich, wenn **alle Zeilen der Spalte „Start-relevant = ja“** auf TESTED bzw. erteilt stehen. Externe Freigaben werden nicht durch Tests ersetzt.

## A. Technik und Sicherheit

| # | Kriterium | Nachweis (reproduzierbar) | Status | Start-relevant |
|---|---|---|---|---|
| A1 | Abhängigkeiten ohne kritische Lücken | `npm audit --omit=dev` nach Prisma-7-Übernahme (Doku 26) | TESTED | ja |
| A2 | Prisma 7 | Doku 07 §8; am 31.10. per Fast-Forward in den Integrationsbranch übernommen (Owner-Freigabe), Tests danach erneut grün (Doku 26) | TESTED | ja |
| A3 | Sessions: HttpOnly/Secure/`__Host-`, CSRF, Fixation, Logout | `session-security.test.ts`, E2E `security-session.spec.ts` | TESTED | ja |
| A4 | Passwortregeln, Rate-Limits | Unit + E2E | TESTED | ja |
| A5 | E-Mail-Bestätigung, Reset, Enumeration-Schutz; **Altkonten mit Frist statt pauschaler Bestätigung** | `consent-and-recovery`, `legacy-email-verification`, `postgres-legacy-migration`, E2E (Doku 19) | TESTED | ja |
| A6 | Echter E-Mail-Versand | Anbietervergleich Doku 21; Adapter Brevo/Postmark nur gegen Mocks getestet | REQUIRES_OWNER (Anbieter, AVV, DNS SPF/DKIM/DMARC) | ja |
| A7 | Verschlüsselung at rest (AES-256-GCM) | Unit, Postgres, Container (31.10. erneut) | TESTED | ja |
| A8 | Schlüssel erzeugt, getrennt gesichert, Rotation geübt | Doku 15; Skript getestet | REQUIRES_OWNER (Verwahrung) | ja |
| A9 | Backups verschlüsselt (age), Restore geübt | 30.10. gegen Temp-DB; Staging-Cron vorbereitet (Doku 22) | TESTED (lokal) / REQUIRES_OWNER (Server, Empfängerschlüssel) | ja |
| A10 | Security-Header + CSP | `csp.spec.ts`, `staging-security-check.sh` | TESTED | ja |
| A11 | Produktions-Preflight | `validate-production-env.mjs` (+ Mail-Anbieter, Plus-Starttermin) | TESTED | ja |
| A12 | Docker-Build + Start gegen Postgres | 31.10. nachmittags: Neubau `5c739f7` mit Staging-Argumenten; Verschlüsselung, Login, Export, Löschung, Vorsorgeprozess, Browser (Doku 27 §2) | TESTED | ja |
| A13 | Domain in Caddy, Origin-Prüfung hinter Proxy | Platzhalter; Staging-Snippet vorbereitet | REQUIRES_OWNER | ja |
| A14 | Host-Speicherplatz | Owner hat am 31.10. Platz geschaffen; nach den Builds 10 GB frei auf `/` (83 %), meine Prüf-Images +2,4 GB (Abschlussbericht §1) | REQUIRES_OWNER (Dauerlösung, Images) | ja |
| A15 | Monitoring/Alarmierung | `staging-healthcheck.sh` (Health, DB, Platte, Backup-Alter), Cron-Vorschlag | IMPLEMENTED (Alarmweg REQUIRES_OWNER) | ja |
| A16 | `docker-compose.prod.yml` reicht Schlüssel/Basis-URL/Mail/Billing an die App weiter | Patch am 31.10. angewandt; `docker compose config` mit Dummy-Werten: alle Variablen gesetzt, ohne Datenschlüssel Abbruch vor dem Start (Doku 22 §8) | TESTED (Konfiguration; nicht deployt) | ja |

## B. Datenschutz

| # | Kriterium | Nachweis | Status | Start-relevant |
|---|---|---|---|---|
| B1 | Ausdrückliche, zweckgebundene, versionierte Einwilligung (Art. 9) | Doku 16, Tests | TESTED (Technik) | ja |
| B2 | Endgültiger Einwilligungstext und Kontotexte (inkl. Altkonten-Hinweis) | Entwurf `2026-10-30-entwurf-1` | REQUIRES_LEGAL_REVIEW | ja |
| B3 | Datenschutzerklärung vollständig | – | REQUIRES_LEGAL_REVIEW | ja |
| B4 | DSFA, Verzeichnis der Verarbeitungstätigkeiten (inkl. Art.-9-Bezug von Mails und Käufen, Doku 21 §0) | – | REQUIRES_LEGAL_REVIEW | ja |
| B5 | AVV Hoster, Mail-, Zahlungsanbieter | Anbieter-DPAs recherchiert (Doku 21) | REQUIRES_OWNER | ja |
| B6 | Export (Art. 15/20) und Löschung (Art. 17) | Tests + E2E | TESTED | ja |
| B7 | Löschfristen Backups, Aufbewahrung Einwilligungsnachweise und Käufe | – | REQUIRES_LEGAL_REVIEW | ja |

## C. Produkt „Vorsorge Plus“

| # | Kriterium | Nachweis | Status | Start-relevant |
|---|---|---|---|---|
| C1 | Vorsorgebereiche | E2E lokal 239 | TESTED | ja |
| C2 | Abgrenzung kostenlos/Plus mit Bestandsschutz | Matrix + Zugangsregel + interne Konzeptseite (Doku 20), Tests; Bestandsschutz vom Owner am 31.10. bestätigt | IMPLEMENTED / REQUIRES_OWNER (Starttermin) | ja |
| C3 | Preis | Testpreis 39 € einmalig (Owner 31.10.) | REQUIRES_OWNER (endgültiger Preis) | ja |
| C4 | Zahlungs-Sandbox | `billing.test.ts`, E2E | TESTED | – |
| C5 | Zahlungsanbieter Stripe (Owner 31.10.) | Testmodus-Adapter Checkout + Webhook, Live-Schlüssel abgelehnt, `stripe-billing.test.ts` (nur Mocks); Einrichtung Doku 25 | TESTED (Testmodus, Mocks) / REQUIRES_OWNER (Amanah-Konto, Live-Modus) | ja |
| C6 | AGB, Widerrufsbelehrung digitale Inhalte, Bestellbutton, Rechnung/USt | – | REQUIRES_LEGAL_REVIEW | ja |
| C7 | Impressum | vorhanden | TESTED (Seite) | ja |
| C8 | Support-Prozess, Sicherheitskontakt | Platzhalter | REQUIRES_OWNER | ja |
| C9 | Öffentliche Preisseite `/preise` passend zum Katalog | 31.10.: `/preise` und Startseiten-Teaser zeigen Kostenlos + Vorsorge Plus (39 €, „In Vorbereitung“, kein Kaufknopf), Inhalte aus `plan-matrix.ts`; alte Stufen 29/79/99 € entfernt; nicht deployt | IMPLEMENTED / REQUIRES_OWNER (Text-Freigabe vor Veröffentlichung) | ja |

## D. Islamisches Wissenszentrum (dauerhaft kostenlos)

| # | Kriterium | Nachweis | Status | Start-relevant |
|---|---|---|---|---|
| D1 | Nichts Ungeprüftes öffentlich | `islamic-knowledge.test.ts`, E2E 404 | TESTED | ja |
| D2 | Qur'an wörtlich + Lizenzbedingungen | `quran-verbatim.test.ts`, `check-quranenc-version.mjs` (31.10.: 1.1.4 aktuell, 8/8 identisch) | TESTED | – |
| D3 | Schriftliche Nutzungsbestätigung Bubenheim/Elyas | Bedingungen nachgeprüft (Doku 23) | REQUIRES_OWNER | nur für Veröffentlichung |
| D4 | Zehn Startartikel geprüft | Prüfpakete mit 111 konkreten Fragen (`docs/review-packages/`) | REQUIRES_SCHOLAR_REVIEW (+ LEGAL für 4, 5, 9, 10) | nein |
| D5 | Redaktionsgremium benannt | – | REQUIRES_OWNER | nein |

## E. Bewusst gesperrt (bleibt beim Start aus)

| # | Funktion | Sperre | Freigabe durch |
|---|---|---|---|
| E1 | Testamentsvorbereitung | `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION` aus | Owner + REQUIRES_LEGAL_REVIEW |
| E2 | Erbquoten-Anzeige | Regelwerk `unreviewed_draft` + Flag | REQUIRES_SCHOLAR_REVIEW |
| E3 | Juristischer Prüfworkflow | nur interne Sandbox | Owner + Kooperationsvertrag + REQUIRES_LEGAL_REVIEW |
| E4 | Externe KI | aus | Owner + Datenschutz |
| E5 | Zahlungen | kein Live-Modus im Code; `stripe_test` nur auf Staging, in Produktion vom Validator abgelehnt | Owner + C5/C6 |
| E6 | Plus-Sperren | `AMANAH_BILLING_ENFORCE` aus; ohne Starttermin technisch abgelehnt | Owner + C2/C6 |
| E7 | Mailversand | `AMANAH_MAIL_TRANSPORT=disabled` | Owner + A6/B5 |

## F. Privater Pilot (Staging, nur synthetische Daten)

| # | Kriterium | Nachweis | Status |
|---|---|---|---|
| F1 | Getrennte Staging-Konfiguration und Datenbank | `docker-compose.staging.yml` (DB im `internal`-Netz, ohne Port), Validator, Tests, Docker-Abnahme 31.10. (Doku 27) | TESTED (lokal, Container) |
| F2 | Nur synthetische Daten erzwungen; interne Seiten unerreichbar | Domain-Allow-List, keine echten Mails, Banner, noindex; interne Werkzeuge auf Staging verboten, `AMANAH_DEV_OUTBOX` nur für die Outbox | TESTED (lokal, Container) |
| F3 | Testkonten | `seed-staging-accounts.mjs` (lokal 3 Konten) | TESTED (lokal) |
| F4 | Backups, Monitoring, Gesundheitsprüfung | Skripte, Cron-Vorschlag | IMPLEMENTED |
| F5 | Deployment-Checkliste, Rückrollplan, Testprotokoll | Doku 27 §6–7, Doku 22 §7 | IMPLEMENTED |
| F6 | Server, DNS, Caddy mit Basic Auth | Snippet vorbereitet | REQUIRES_OWNER |

## Empfehlung

**Öffentlicher Start: No-Go.** **Privater Pilot mit synthetischen Daten: Go, sobald der Owner F6, A13 und A14 freigibt** (Server, DNS, Caddy, Speicher). Dafür sind keine Rechtstexte nötig, weil keine echten Personen beteiligt sind.

**Weg zum öffentlichen Start:**
1. ~~A16 und A2~~ erledigt am 31.10.
2. A6/A8/A9 auf dem Server, A15-Alarmweg
3. B2–B5, B7
4. C2/C3 bestätigen, C5, C6, C8, C9
5. Pilot mit wenigen echten Nutzern nach Datenschutzfreigabe
6. Start „Vorsorge Plus“

Das Wissenszentrum kann parallel Artikel für Artikel nach echter Prüfung live gehen.
