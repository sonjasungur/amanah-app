# Autopilot-Masterplan

Stand: 2026-10-30, Abschluss der Autopilot-Sitzung (siehe Dokument 14) · Branch `feat/vorsorge-testament-foundation` (Integrationsstand), Prisma 7 auf eigenem Branch
Status: TODO · IN_PROGRESS · IMPLEMENTED · TESTED · BLOCKED · REQUIRES_OWNER · REQUIRES_LEGAL_REVIEW · REQUIRES_SCHOLAR_REVIEW

## Grenzen (unverändert)

Kein Deployment, keine Produktions-DB, keine echten Zahlungen/Mails/Kontakte, keine Veröffentlichung ungeprüfter religiöser Inhalte, keine Aktivierung der Erbquoten, kein Merge nach `main`. Push nur `feat/vorsorge-testament-foundation` → GitHub (freigegeben 2026-10-30).

## Aufgaben

| ID | Prio | Aufgabe | Abhängig von | Status | Nachweis |
|---|---|---|---|---|---|
| A1 | A | Verschlüsselung Ordnerdaten (AES-256-GCM, Envelope) | – | TESTED | Commit 572526e, Doku 15 |
| A2 | A | Schlüsselverwaltung, Rotation, Altbestände | A1 | TESTED | `scripts/reencrypt-amanah-data.mjs`, Postgres-Test |
| A3 | A | Backup-/Restore-Verschlüsselung (age) | – | TESTED | manueller Lauf gegen Temp-DB, Doku 15 |
| A4 | A | Einwilligung Art. 9 (zweckgebunden, versioniert, widerrufbar) | Schema | TESTED | 37bd9bf, Doku 16 |
| A5 | A | E-Mail-Verifizierung, Passwort-Reset, Enumeration-Schutz | Schema | TESTED | 37bd9bf, Doku 16 (echter Mailversand: REQUIRES_OWNER) |
| A6 | A | Docker-Build und Konfigurationsprüfung | – | TESTED | 939afab (Prisma 6, Node 24; Container gegen Temp-DB) |
| A7 | A | Rechtstexte Datenschutz/Einwilligung | A4 | REQUIRES_LEGAL_REVIEW | – |
| B1 | B | Prisma 7 auf eigenem Branch/Worktree | A4/A5-Schema | IMPLEMENTED | `chore/prisma-7` 3c002f7; Docker-Runner NOT_RUN (Plattenplatz) → nicht gemergt |
| C1 | C | Zehn Startartikel als prüfbare Entwürfe | – | TESTED | 0f71db9 (Entwürfe, Tor blockiert sie) |
| C2 | C | Redaktionssystem (Admin, Versionen, Lesezeichen, SEO) | C1 | IMPLEMENTED | Redaktionsansicht, Prüfpakete, Lesezeichen, Sitemap/robots (0f71db9); DB-gestütztes CMS: TODO |
| C3 | C | Fachliche Prüfung der Artikel | C1 | REQUIRES_SCHOLAR_REVIEW | – |
| D1 | D | Vorsorge Plus: Produktlogik, Entitlements, Funktionsübersicht | – | TESTED | f5529d8, 6e31a62 (Dokumente, Personen); Abgrenzung Basis/Plus: REQUIRES_OWNER |
| E1 | E | Zahlungs-Sandbox (Webhook-Signatur, Idempotenz, Erstattung) | D1 | TESTED | f5529d8, Doku 17; Live-Anbieter: REQUIRES_OWNER |
| F1 | F | Testamentsfragebogen (gesperrt, rechtlich getrennt) | – | TESTED | e23c90a; Freischaltung: REQUIRES_LEGAL_REVIEW |
| F2 | F | Erbquoten-Engine erweitern (gesperrt) | – | TESTED | e23c90a (27 Tests); Regeln: REQUIRES_SCHOLAR_REVIEW |
| F3 | F | Juristischer Prüfworkflow (Sandbox) | F1 | TESTED | f03018e (Domänenmodul + interne Demo); Persistenz/Kanzleikonten: REQUIRES_OWNER |
| G1 | G | Navigation „Islamisches Wissen / Vorsorge / Testament / Janazah / Konto“ | – | TESTED | 31e8e29, E2E Navigation |
| H1 | H | Gesamttests (Unit, Postgres, E2E Desktop/Mobil, Docker) | alle | TESTED | 464 Unit, 18 Postgres, 239 E2E lokal, 59 E2E API+Postgres; Docker zuletzt bei 939afab |
| H2 | A | Content Security Policy | – | TESTED | ffa42bd, `csp.spec.ts` |

## Technische Entscheidungen

| Datum | Entscheidung | Begründung |
|---|---|---|
| 2026-10-30 | Envelope-Verschlüsselung in der App statt pgcrypto | Schlüssel bleiben außerhalb der DB; Rotation ohne Neuverschlüsselung der Daten |
| 2026-10-30 | age statt GPG für Backups | einfache Empfängerschlüssel, kein Keyring auf dem Server |
| 2026-10-30 | Restore liest `.age` über stdin | funktioniert identisch mit lokalem Binary und Container-Wrapper |
| 2026-10-30 | `age`-Binary aus GitHub nicht ausgeführt (kein prüfbarer Digest); Test über Alpine-Paket im Wegwerf-Container | Supply-Chain-Risiko vermeiden |
| 2026-10-30 | Registrierung ohne Sofort-Login, identische Antworten | Schutz gegen Account-Enumeration |
| 2026-10-30 | Bestandskonten bei Migration als bestätigt markiert | keine Aussperrung; REQUIRES_OWNER zur Bestätigung |
| 2026-10-30 | Einstellungsseite vom Einwilligungsschritt ausgenommen | Export, Widerruf, Löschung immer erreichbar |
| 2026-10-30 | CSP ohne Nonces | Seiten bleiben statisch; externe Skripte/Verbindungen dennoch blockiert |
| 2026-10-30 | Wissensartikel bleiben Code-Daten (Git-versioniert) statt DB-CMS | Nachvollziehbarkeit über Commits; DB-CMS erst mit Redaktionsteam |
| 2026-10-30 | Testament- und Prüfworkflow als gesperrte/Sandbox-Module | fachlich kritisch, keine Freigabe vorhanden |
| 2026-10-30 | Prisma 7 nicht gemergt | Docker-Runner-Build nicht verifizierbar (Host-Platte 99 % voll, Bereinigung eigener Images) |

## Vorfälle

- 2026-10-30 ~14:30: Host-Datenträger lief durch eigene Docker-Builds auf 99 % voll; der eigene Temp-Postgres-Container wurde beendet (nur synthetische Daten). Bereinigt: nur eigene Images/Layer und Scratch-Dateien; fremde Container liefen weiter. Danach 5 GB frei. **Owner: Speicherplatz des Hosts prüfen.**

## Offene Fragen / Freigabepunkte

Siehe Dokument 11 und 13.
