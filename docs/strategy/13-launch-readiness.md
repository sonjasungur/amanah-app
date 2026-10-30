# Launch-Readiness – überprüfbare Freigabematrix

Stand: 2026-10-30 · Integrationsbranch `feat/vorsorge-testament-foundation` · Ziel: **erster sicherer Start = „Vorsorge Plus“ (ohne Testament, ohne Erbquoten)**
Status: TESTED (technisch nachgewiesen) · IMPLEMENTED (ohne vollständigen Nachweis) · TODO · BLOCKED · REQUIRES_OWNER · REQUIRES_LEGAL_REVIEW · REQUIRES_SCHOLAR_REVIEW

Regel: Ein Start ist erst möglich, wenn **alle Zeilen der Spalte „Start-relevant = ja“** auf TESTED bzw. erteilt stehen. Externe Freigaben werden nicht durch Tests ersetzt.

## A. Technik und Sicherheit

| # | Kriterium | Nachweis (reproduzierbar) | Status | Start-relevant |
|---|---|---|---|---|
| A1 | Abhängigkeiten ohne kritische Lücken | `npm audit --omit=dev` → 0 critical; 3 high nur Prisma-6-CLI (Doku 07) | TESTED | ja |
| A2 | Prisma 7 (beseitigt die 3 high) | Branch `chore/prisma-7`; Docker-Runner-Build fehlt | IMPLEMENTED | nein (Risiko akzeptiert, Doku 07) |
| A3 | Sessions: HttpOnly/Secure/`__Host-`, CSRF, Fixation, Logout | `session-security.test.ts`, E2E `security-session.spec.ts` | TESTED | ja |
| A4 | Passwortregeln, Rate-Limits | Unit + E2E | TESTED | ja |
| A5 | E-Mail-Bestätigung, Passwort-Reset, Enumeration-Schutz | `consent-and-recovery.test.ts`, `postgres-account.test.ts`, E2E | TESTED | ja |
| A6 | Echter E-Mail-Versand (Anbieter, AVV, SPF/DKIM) | – | REQUIRES_OWNER | ja |
| A7 | Verschlüsselung at rest (AES-256-GCM) | `data-encryption.test.ts`, `postgres-encryption.test.ts`, Container-Test | TESTED | ja |
| A8 | Schlüssel erzeugt, getrennt gesichert, Rotation geübt | Doku 15; Skript getestet | REQUIRES_OWNER (Schlüsselverwahrung) | ja |
| A9 | Backups verschlüsselt (age), Restore geübt | manueller Lauf gegen Temp-DB (Doku 15) | TESTED (lokal) / REQUIRES_OWNER (Server, Empfängerschlüssel) | ja |
| A10 | Security-Header + CSP | `csp.spec.ts`, Smoke-Tests | TESTED | ja |
| A11 | Produktions-Preflight (Secrets, Schlüssel, kein Outbox/Sandbox/Interne Tools) | `phase-4a.test.ts`, `pilot-release-hardening.test.ts` | TESTED | ja |
| A12 | Docker-Build + Start gegen Postgres | Commit 939afab (Node 24), Smoke im Container | TESTED (Stand 939afab) – nach späteren Commits erneut bauen | ja |
| A13 | Domain in Caddy, Origin-Prüfung hinter Proxy | `deploy/Caddyfile` ist Platzhalter | REQUIRES_OWNER | ja |
| A14 | Host-Speicherplatz | Host lief am 30.10. auf 99 % voll | REQUIRES_OWNER | ja |
| A15 | Monitoring/Alarmierung, Log-Aufbewahrung | – | TODO | ja |

## B. Datenschutz

| # | Kriterium | Nachweis | Status | Start-relevant |
|---|---|---|---|---|
| B1 | Ausdrückliche, zweckgebundene, versionierte Einwilligung (Art. 9) | Doku 16, Tests | TESTED (Technik) | ja |
| B2 | Endgültiger Einwilligungstext | Entwurf `2026-10-30-entwurf-1` | REQUIRES_LEGAL_REVIEW | ja |
| B3 | Datenschutzerklärung vollständig | – | REQUIRES_LEGAL_REVIEW | ja |
| B4 | DSFA, Verzeichnis der Verarbeitungstätigkeiten | – | REQUIRES_LEGAL_REVIEW | ja |
| B5 | AVV Hoster (und Mail-/Zahlungsanbieter) | – | REQUIRES_OWNER | ja |
| B6 | Export (Art. 15/20) und Löschung (Art. 17) | Tests + E2E | TESTED | ja |
| B7 | Löschfristen Backups, Aufbewahrung Einwilligungsnachweise und Käufe | – | REQUIRES_LEGAL_REVIEW | ja |

## C. Produkt „Vorsorge Plus“

| # | Kriterium | Nachweis | Status | Start-relevant |
|---|---|---|---|---|
| C1 | Vorsorgebereiche (Notfall, Janazah, Dokumente, Personen, Schulden, Familienbrief, Export) | E2E lokal 239 | TESTED | ja |
| C2 | Basis/Plus-Abgrenzung festgelegt | `PlusGate`, Enforcement aus | REQUIRES_OWNER | ja |
| C3 | Preis (29 € oder 39 €) | konfigurierbar | REQUIRES_OWNER | ja |
| C4 | Zahlungs-Sandbox (Signatur, Idempotenz, Erstattung) | `billing.test.ts`, E2E | TESTED | – |
| C5 | Echter Zahlungsanbieter, Live-Adapter | – | REQUIRES_OWNER | ja |
| C6 | AGB, Widerrufsbelehrung digitale Inhalte, Bestellbutton, Rechnung/USt | – | REQUIRES_LEGAL_REVIEW | ja |
| C7 | Impressum | vorhanden (MSC Engineering GmbH) | TESTED (Seite) | ja |
| C8 | Support-Prozess, Sicherheitskontakt (`SECURITY.md`) | Platzhalter | REQUIRES_OWNER | ja |

## D. Islamisches Wissenszentrum (dauerhaft kostenlos)

| # | Kriterium | Nachweis | Status | Start-relevant |
|---|---|---|---|---|
| D1 | Nichts Ungeprüftes öffentlich | `islamic-knowledge.test.ts`, E2E 404/Gate | TESTED | ja |
| D2 | Qur'an wörtlich + Lizenzbedingungen | `quran-verbatim.test.ts`, Doku 09 | TESTED | – |
| D3 | Nutzungsbestätigung Bubenheim/Elyas | – | REQUIRES_OWNER | nur für Veröffentlichung |
| D4 | Zehn Startartikel geprüft | Entwürfe + Prüfpakete | REQUIRES_SCHOLAR_REVIEW (+ LEGAL für 4, 5, 9, 10) | nein (Start auch ohne Artikel möglich) |
| D5 | Redaktionsgremium benannt | – | REQUIRES_OWNER | nein |

## E. Bewusst gesperrt (bleibt beim Start aus)

| # | Funktion | Sperre | Freigabe durch |
|---|---|---|---|
| E1 | Testamentsvorbereitung | `NEXT_PUBLIC_AMANAH_TESTAMENT_PREPARATION` aus | Owner + REQUIRES_LEGAL_REVIEW |
| E2 | Erbquoten-Anzeige | Regelwerk `unreviewed_draft` + Flag | REQUIRES_SCHOLAR_REVIEW |
| E3 | Juristischer Prüfworkflow | nur interne Sandbox | Owner + Kooperationsvertrag + REQUIRES_LEGAL_REVIEW |
| E4 | Externe KI | `AMANAH_AI_ENABLED`/UI aus | Owner + Datenschutz |
| E5 | Zahlungen | kein Live-Modus im Code | Owner + C5/C6 |

## Empfehlung

**No-Go** für einen öffentlichen Start heute. **Go-Pfad:** A6, A8, A9 (Server), A12 (Re-Build), A13–A15, B2–B5, B7, C2, C3, C5, C6, C8 erledigen → dann privater Pilot mit wenigen Nutzern → öffentlicher Start „Vorsorge Plus“. Wissenszentrum kann parallel Artikel für Artikel nach Prüfung live gehen.
