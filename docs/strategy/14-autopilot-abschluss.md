# Autopilot-Abschluss – Amanah / „Mein Wille“

Stand: 2026-10-30 · Agent: Claude Code · Grundlage: Masterauftrag und P0-Auftrag vom 30.10.
Keine externen Freigaben wurden erteilt oder ersetzt. Keine Produktion, keine echten Zahlungen, Mails oder Kontakte.

## 1. Git-Stand und Branches

| Branch | Stand | Remote |
|---|---|---|
| `feat/vorsorge-testament-foundation` (Integration) | 30 Commits seit `main` @ `1fdb5db` | vollständig auf GitHub (P0-Freigabe für diesen Branch; Push nach Abschlussprüfung und Secret-Scan) |
| `chore/prisma-7` | `3c002f7` (auf `939afab`) | nur lokal (keine Push-Freigabe für diesen Branch) |
| `main` | unverändert `1fdb5db` | kein Merge |
| GitLab `origin` | unverändert | nicht synchronisiert |

Uncommitted: nur `AI_HANDOFF.md` (wird nie committet) und `docs/qa/` (fremd, unverändert).

## 2. Neue Commits dieser Sitzung (nach `5d10314`)

572526e Verschlüsselung · 37bd9bf Einwilligung + E-Mail/Reset · a138d1c Doku · 939afab Docker Node 24 · 5f953c6 Doku · 0f71db9 Wissenszentrum · f5529d8 Billing-Sandbox · 6e31a62 Dokumente/Personen · e23c90a Testamentsvorbereitung · f03018e Prüfworkflow · 31e8e29 Navigation · ffa42bd CSP · 43f7936 Testkorrektur · (dieser Bericht) — sowie `3c002f7` auf `chore/prisma-7`.

## 3. Implementierte Funktionen

- **Sicherheit:** AES-256-GCM-Envelope-Verschlüsselung der Ordnerdaten (Schlüssel aus der Umgebung, AAD an Nutzer gebunden, Rotation, Umverschlüsselungsskript); verschlüsselte Backups mit age; CSP; Produktions-Preflight für Schlüssel, Mail, Billing und interne Werkzeuge.
- **Konto:** E-Mail-Bestätigung, Passwort-Reset (einmalige, ablaufende, gehashte Tokens), Schutz gegen Account-Enumeration, Rate-Limits, Reset meldet alle Sitzungen ab, Mail-Links nur aus der Konfiguration.
- **Datenschutz:** zweckgebundene, versionierte, nicht vorangekreuzte Einwilligung mit Nachweis und Widerruf (der Server löscht dann die Ordnerdaten); Einstellungen sind immer erreichbar; Einwilligungen sind im Export enthalten.
- **Vorsorge:** Dokumenten-Checkliste (Status und Ablageort, keine Dateien), Familie & Vertrauenspersonen mit Rollen; Navigation mit den fünf Hauptbereichen.
- **Vorsorge Plus / Zahlung:** Produktkatalog mit Testpreisen 29/39 €, `PlusGate` (aus), Sandbox-Kasse mit signierten Webhooks, Idempotenz, Erstattung, Testbeleg; Käufe werden bei Kontolöschung anonymisiert.
- **Wissenszentrum:** zehn Startartikel als prüfbare Entwürfe, Redaktionsmarker und fehlende Schulpositionen blockieren die Veröffentlichung, druckbare Prüfpakete, Lesezeichen, Sitemap und robots (nur Veröffentlichtes).
- **Testament (gesperrt):** Fragebogen mit fünf getrennten Ergebnisteilen, Fragen an Anwalt/Notar, Zuordnung zur Erbquoten-Engine ohne Raten, weitere Engine-Testfälle und ein Eigenschaftstest.
- **Prüfworkflow (Sandbox):** auditierte Statusmaschine mit strikter Kanzlei-Sichtbarkeit und interner Demo.
- **Prisma 7** auf eigenem Branch.

## 4. Erfolgreiche Tests (alle selbst ausgeführt, 30.10.)

| Prüfung | Ergebnis |
|---|---|
| Vitest | 464 bestanden, 10 skipped (Postgres-Dateien ohne DB-Env) |
| Postgres-Integration (temporäre PostgreSQL 16.6) | 18/18 |
| Playwright lokal (Desktop + Mobil) | 239 bestanden, 69 skipped (API-only) |
| Playwright API-Modus + Postgres + Billing-Sandbox + CSP | 59 bestanden, 7 skipped (Mobil-Duplikate der seriellen Spec) |
| tsc, ESLint | ok |
| gitleaks (28 Commits, Dateibaum) | keine Funde |
| Docker (Integration, Stand 939afab): Build, Start gegen Postgres, Verschlüsselung, keine sensiblen Logs | ok |
| Verschlüsseltes Backup + Restore (age) | ok |
| Prisma 7: Unit, 17 Postgres, 56 E2E, `migrate diff`, Standalone | ok |

## 5. Nicht ausgeführte Tests

- Docker-Runner-Build für `chore/prisma-7` (`NOT_RUN`: Host-Datenträger voll).
- Docker-Build des Integrationsstands nach `939afab` (`NOT_RUN`: Speicherplatz; der Standalone-Build lief).
- Echter Mailversand, echte Zahlungen, Lasttests, Barrierefreiheits-Audit mit Screenreader, Tests auf echten Mobilgeräten (nur Emulation).

## 6. Technische Sicherheitsbewertung

Gut für einen **privaten Pilot** nach Erledigung der Owner-Punkte: Sessions, CSRF, Fixation, Enumeration-Schutz, Verschlüsselung at rest, CSP, Export und Löschung sind getestet. Rest-Risiken:
- Rate-Limits gelten nur pro Prozess.
- Inline-Skripte sind in der CSP erlaubt.
- E-Mail und Name liegen im Klartext in der Datenbank.
- Kein 2FA.
- Prisma-6-CLI-Advisory (nicht ausnutzbar, Doku 07).
- Die Schlüsselverwahrung liegt beim Betreiber.

## 7. Fertigstellungsgrad (technisch, Schätzung)

| Modul | Grad | Fehlt |
|---|---|---|
| Sicherheit/Konto | 90 % | Mailanbieter, 2FA, verteiltes Rate-Limit |
| Datenschutz-Technik | 85 % | endgültige Texte, Backup-Löschkonzept |
| Vorsorge (Basis) | 85 % | Feinschliff, serverseitiges PDF optional |
| Vorsorge Plus | 70 % | Abgrenzung, Live-Zahlung, AGB/Rechnung |
| Wissenszentrum (System) | 80 % | DB-CMS für Redaktion, Mehrsprachigkeit der Inhalte |
| Wissenszentrum (Inhalte) | 10 % | fachliche Prüfung aller Artikel |
| Testamentsvorbereitung | 70 % (gesperrt) | rechtliche Abnahme |
| Erbquoten-Engine | 60 % (gesperrt) | Gelehrtenprüfung, weitere Regelwerke |
| Prüfworkflow | 40 % (Sandbox) | Persistenz, Kanzleikonten, Verträge |

## 8. Vorbereitete Wissensartikel

10 Entwürfe (Doku 10): Grundlagen, Qur'an 4:11/12/176, Rechenbeispiele, Waṣiyya, Schulden, erste Stunden nach dem Tod, Ghusl, Kafan/Janāza-Gebet, Bestattung in Deutschland, Sadaqa Jāriya; dazu 34 übernommene Altinhalte im Prüfprozess. **Veröffentlicht: 0.**

## 9. Offene Lizenzfragen

Schriftliche Bestätigung für Bubenheim/Elyas (QuranEnc bzw. Rechteinhaber); Meldung zweier Textfehler an QuranEnc (Kontakt nicht erfolgt); Hadith-Übersetzungen nur als eigene Wiedergaben; Lizenzstatus der Gradierungen in der hadith-api ungeklärt.

## 10. Offene religiöse Prüfungen

Alle Artikel und Altinhalte; Positionen der vier Schulen je Streitfrage; Gradierungen (Tirmidhī 1054) gegen gedruckte Ausgaben; Regeln der Erbquoten-Engine und Rechenbeispiele; Auswahl des Prüfmodells (Gremium, Schulen).

## 11. Offene juristische Prüfungen

RDG-Abgrenzung der Testamentsvorbereitung und der Parallelanzeige; Hinweistexte und Normverweise; Rechtsfragen in Bereich E; Vergütung der Kanzleikooperation (§ 49b BRAO); AGB, Widerruf, Rechnung; Aufbewahrung von Käufen und Einwilligungsnachweisen.

## 12. Offene Datenschutzfragen

Endgültiger Einwilligungstext; Datenschutzerklärung; DSFA; AVV (Hoster, Mail, Zahlung); Daten Dritter; Löschfristen für Backups; Logs.

## 13. Restaufwand bis „Vorsorge Plus“ (Technik)

Etwa **8–12 PT**:

| Paket | PT |
|---|---|
| Mailanbieter-Adapter | 1–1,5 |
| Live-Zahlungsadapter | 2–3 |
| Basis/Plus-Abgrenzung umsetzen | 1 |
| Prisma 7 mergen + Docker-Rebuild | 0,5–1 |
| Monitoring/Logging | 1–2 |
| Pilotbetrieb und Fehlerbehebung | 2–3 |

Dazu kommen externe Rechts-, Datenschutz- und Steuerarbeit (nicht schätzbar).

## 14. Blocker und Entscheidungen des Owners

1. Host-Speicherplatz (Server war auf 99 %).
2. Mail- und Zahlungsanbieter.
3. Abgrenzung Basis/Plus und Preis (29 oder 39 €).
4. Bestandskonten bei der Migration als „bestätigt“ behandeln (umgesetzt, bitte bestätigen).
5. Schlüsselverwahrung und age-Empfänger.
6. Domain und Caddy.
7. Rechtsberatung und Datenschutzberatung beauftragen.
8. Prüfgremium für das Wissenszentrum.
9. Lizenzbestätigung QuranEnc.
10. Merge-Freigaben (`feat/…` nach `main`, `chore/prisma-7`).
11. GitLab-Synchronisation.

## 15. Nächste Schritte zum Produktionsstart

1. Branch reviewen, `chore/prisma-7` mit Docker-Build verifizieren, beides in `main` mergen (Freigabe).
2. Owner-Punkte A6, A8, A9, A13, A14, C2, C3, C5 aus Dokument 13.
3. Rechtstexte (B2–B4, C6) beauftragen.
4. Privaten Pilot mit Testkonten, verschlüsselten Backups und Restore-Probe auf dem Server.
5. Öffentlicher Start „Vorsorge Plus“; Wissensartikel einzeln nach Prüfung veröffentlichen.

---

**Technisch fertig:**
- Sichere Konten und Sitzungen
- Verschlüsselung
- Einwilligung, Export und Löschung
- Vorsorgebereiche
- Zahlungs-Sandbox
- Wissens-Freigabesystem
- Gesperrte Testamentsvorbereitung, Erbquoten-Engine und Prüfworkflow (jeweils mit Tests)

**Fachlich zu prüfen:**
- Alle religiösen Inhalte und Rechenregeln
- Alle Rechts- und Datenschutztexte
- Die RDG-Abgrenzung

**Nicht produktionsreif:**
- Mailversand und Live-Zahlung
- Monitoring
- Server-Setup (Domain, Schlüssel, Backups)
- Prisma-7-Merge
- DB-gestütztes Redaktions-CMS
- Persistenter Prüfworkflow

**Ohne weitere Freigabe nicht aktivieren:**
- Testamentsvorbereitung und Erbquoten-Anzeige
- Prüfworkflow mit echten Kanzleien
- Echte Zahlungen
- Externe KI
- Veröffentlichung von Wissensartikeln
- Billing-Enforcement
