# Autopilot-Masterplan

Stand: wird fortlaufend aktualisiert · Branch `feat/vorsorge-testament-foundation` (Integrationsstand), Prisma 7 auf eigenem Branch
Status: TODO · IN_PROGRESS · IMPLEMENTED · TESTED · BLOCKED · REQUIRES_OWNER · REQUIRES_LEGAL_REVIEW · REQUIRES_SCHOLAR_REVIEW

## Grenzen (unverändert)

Kein Deployment, keine Produktions-DB, keine echten Zahlungen/Mails/Kontakte, keine Veröffentlichung ungeprüfter religiöser Inhalte, keine Aktivierung der Erbquoten, kein Merge nach `main`. Push nur `feat/vorsorge-testament-foundation` → GitHub (freigegeben 2026-10-30).

## Aufgaben

| ID | Prio | Aufgabe | Abhängig von | Status | Nachweis |
|---|---|---|---|---|---|
| A1 | A | Verschlüsselung Ordnerdaten (AES-256-GCM, Envelope) | – | TESTED | Commit 572526e, Doku 15 |
| A2 | A | Schlüsselverwaltung, Rotation, Altbestände | A1 | TESTED | `scripts/reencrypt-amanah-data.mjs`, Postgres-Test |
| A3 | A | Backup-/Restore-Verschlüsselung (age) | – | TESTED | manueller Lauf gegen Temp-DB, Doku 15 |
| A4 | A | Einwilligung Art. 9 (zweckgebunden, versioniert, widerrufbar) | Schema | IN_PROGRESS | – |
| A5 | A | E-Mail-Verifizierung, Passwort-Reset, Enumeration-Schutz | Schema | TODO | – |
| A6 | A | Docker-Build und Konfigurationsprüfung | – | TODO | – |
| A7 | A | Rechtstexte Datenschutz/Einwilligung | A4 | REQUIRES_LEGAL_REVIEW | – |
| B1 | B | Prisma 7 auf eigenem Branch/Worktree | A4/A5-Schema | TODO | – |
| C1 | C | Zehn Startartikel als prüfbare Entwürfe | – | TODO | – |
| C2 | C | Redaktionssystem (Admin, Versionen, Lesezeichen, SEO) | C1 | TODO | – |
| C3 | C | Fachliche Prüfung der Artikel | C1 | REQUIRES_SCHOLAR_REVIEW | – |
| D1 | D | Vorsorge Plus: Produktlogik, Entitlements, Funktionsübersicht | – | TODO | – |
| E1 | E | Zahlungs-Sandbox (Webhook-Signatur, Idempotenz, Erstattung) | D1 | TODO | – |
| F1 | F | Testamentsfragebogen (gesperrt, rechtlich getrennt) | – | TODO | – |
| F2 | F | Erbquoten-Engine erweitern (gesperrt) | – | TODO | – |
| F3 | F | Juristischer Prüfworkflow (Sandbox) | F1 | TODO | – |
| G1 | G | Navigation „Islamisches Wissen / Vorsorge / Testament / Janazah / Konto“ | – | TODO | – |
| H1 | H | Gesamttests (Unit, Postgres, E2E Desktop/Mobil, Docker) | alle | TODO | – |

## Technische Entscheidungen

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-10-30 | Envelope-Verschlüsselung in der App statt pgcrypto | Schlüssel bleiben außerhalb der DB; Rotation ohne Neuverschlüsselung der Daten |
| 2026-10-30 | age statt GPG für Backups | einfache Empfängerschlüssel, kein Keyring auf dem Server |
| 2026-10-30 | Restore liest `.age` über stdin | funktioniert identisch mit lokalem Binary und Container-Wrapper |
| 2026-10-30 | `age`-Binary aus GitHub nicht ausgeführt (kein prüfbarer Digest); Test über Alpine-Paket im Wegwerf-Container | Supply-Chain-Risiko vermeiden |

## Offene Fragen / Freigabepunkte

Siehe Dokument 11 und 13.
