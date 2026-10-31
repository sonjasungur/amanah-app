# Abschlussbericht: Technik und Pilotvorbereitung

Stand: 2026-10-31 · Agent: Claude Code · Grundlage: Auftrag „Abschlussphase Technik und Pilotvorbereitung“ und Aktualisierung „Speicherplatz erledigt“
Nicht erfolgt: Deployment, Produktionsänderung, Merge nach `main`, Push, echte Zahlung, echter Mailversand, externe Kontakte, Veröffentlichung von Artikeln.

## Git-Stand

| Branch | Stand | Remote |
|---|---|---|
| `feat/vorsorge-testament-foundation` | `02cc7ad`; 8 neue Commits seit `54de095` (zuletzt auf GitHub) | **nicht gepusht** (keine Freigabe für diesen Schritt) |
| `chore/prisma-7` | Integration + 2 Commits (Prisma 7, Anpassungen); Code getestet als `c5bf156` | nur lokal |
| `main` | `1fdb5db` unverändert | – |

Neue Commits: `5fdb570` Altkonten · `c573683` Vorsorge Plus · `145204b` Mail-Anbieter · `acbcc0c` Prüfpakete · `6e80a47` Staging · `d1ffc08`/`02cc7ad` Secret-Scan-Bereinigung · Doku-Commit (dieser Bericht).

## 1. Speicherplatz

Wie angewiesen nur `df -h` und `docker system df`, keine Bereinigung durch mich.

| Zeitpunkt | `/` frei | Docker-Images | Build-Cache |
|---|---|---|---|
| Start (08:39) | 8,5 GB (85 %) | 9,66 GB | 0 B |
| vor dem Docker-Build | 12 GB | 9,66 GB | 0 B |
| Minimum während des Builds (Wächter, Abbruch bei < 3 GB) | 9 GB | – | – |
| Ende | 10 GB (83 %) | 12,05 GB | 0 B |

Von mir angelegt und noch vorhanden: `amanah-p7-check:c5bf156` (276 MB) und `amanah-p7-migrate:c5bf156` (1,31 GB), zusammen mit Zwischenschichten **+2,4 GB**. Entfernt habe ich nur meine eigenen Wegwerf-Artefakte außerhalb von Docker-Images: Testcontainer, temporäre Datenbank (lief im RAM), `node_modules` und Build des Prisma-7-Worktrees im Scratchpad.

**Sicherer Bereinigungsvorschlag (nur mit Freigabe):**

```bash
docker rmi amanah-p7-check:c5bf156 amanah-p7-migrate:c5bf156   # ≈ 2,4 GB, nur meine Prüf-Images
```

Alle anderen Images, Volumes und Container gehören zu anderen Projekten und bleiben unberührt. Dauerhaft: Docker-Root (`/var/lib/docker`) liegt auf der 57-GB-Systemplatte, `/mnt/daten` hat 141 GB frei. Eine Verlagerung des Docker-Root wäre eine Serveränderung (REQUIRES_OWNER).

## 2. Prisma 7

**Bereit zur Integration** (Doku 07 §7). Auf den aktuellen Stand gebracht; zwei Anpassungen für seither hinzugekommenen Code:
- Billing nutzt den `Prisma`-Namespace des generierten Clients.
- Die Legacy-E2E-Spec nutzt `pg`.

Alle Prüfebenen sind grün:
- Unit-Tests, Postgres-Integration, Browser-Tests
- Migration auf frischer DB und auf einer von Prisma 6 angelegten DB
- Docker-Runner und Migrate-Image, Container-Smoke
- `npm audit`: 0

**Vorschlag:** Fast-Forward von `chore/prisma-7` in den Integrationsbranch (Freigabe nötig).

## 3. Testergebnisse (alle selbst ausgeführt, 31.10.)

| Prüfung | Integration¹ | Prisma 7² |
|---|---|---|
| tsc, ESLint | ok | ok |
| Vitest | 507 bestanden, 13 skipped | 507 bestanden, 13 skipped |
| Postgres-Integration (temporäre PostgreSQL 16.6) | 20/20 | 20/20 (auf DB von Prisma 6) |
| `migrate diff` / `migrate status` | keine Abweichung | keine Abweichung; Prisma-6-DB „up to date“ |
| Playwright lokal (Desktop + Mobil) | 239 bestanden, 73 skipped | 239 bestanden, 73 skipped |
| Playwright API-Modus + Postgres (Sicherheit, Fehlerpfade, Altkonten, CSP, Sandbox-Kauf) | 61 bestanden, 9 skipped | 61 bestanden, 9 skipped |
| Docker-Build + Container gegen Postgres | – | ok |
| Staging-Probelauf (Validator, Seed, Health 5/5, Security 9/9) | ok | – |
| `npm audit --omit=dev` | 3 high (Prisma-6-CLI) | 0 |
| gitleaks (Commits seit `main`) | 37, keine Funde | 39, keine Funde |

¹ Unit, Lint und Typen auf `02cc7ad`. E2E und Postgres auf `6e80a47`; spätere Commits ändern nur `.env.staging.example`, `.gitleaksignore` und Doku.
² Getestet als `c5bf156`; seither nur dieselben Nicht-Code-Dateien (Rebases).

**`NOT_RUN`:**
- Basic Auth, HSTS und Caddy für Staging (kein Deployment)
- Backup/Restore auf Staging (Skript am 30.10. bestanden, unverändert)
- Echter Mail- und Zahlungsanbieter
- Last-, Screenreader- und Echtgerätetests

**Durch Tests gefundene und behobene Fehler:**
1. Die Bestätigungs-Route antwortete mit veraltetem Nutzerstand (nur mit Postgres sichtbar).
2. Eine verspätete Sitzungsabfrage konnte eine neue Sitzung überschreiben.
3. Zwei Fiqh-Quellen ergaben ununterscheidbare Prüffragen.
4. Prisma 7 war mit neuem Billing-Code inkompatibel.
5. Die Legacy-Spec war unter Prisma 7 nicht ladbar.

**Eigener Fehler:** Ich habe einmal die Test-DB als Shadow-DB übergeben. Prisma hat sie dabei zurückgesetzt. Betroffen war nur die temporäre RAM-Datenbank mit synthetischen Daten. Für den Prisma-6→7-Test habe ich danach eine frische DB verwendet.

## 4. E-Mail-Migration für Altkonten

Doku 19. Die pauschale Bestätigung wird durch eine neue Migration zurückgenommen; Altkonten erhalten den Status „Bestätigung ausstehend“ mit Frist (Standard 60 Tage):
- Anmelden, Lesen, Export und Löschen bleiben jederzeit möglich.
- Speichern ist bis Fristende möglich; danach pausiert es bis zur Bestätigung.
- Kaufen ist erst nach Bestätigung möglich.
- Ein Hinweis im Dashboard bietet „Bestätigungslink senden“ an; es gibt keine automatischen Mails.
- Neue Konten müssen weiter vor der ersten Anmeldung bestätigen.
- Ein Passwort-Reset über das Postfach bestätigt ebenfalls.

## 5. Kostenlos / Vorsorge Plus

Doku 20, Konzeptseite `/intern/vorsorge-plus`.

| Kostenlos (nie sperrbar) | Vorsorge Plus – Testpreis 39 € einmalig |
|---|---|
| Islamisches Wissenszentrum | Dauerhafter, verschlüsselter Vorsorgeordner im Konto |
| Erbrecht- und Janazah-Informationen | Familie und Vertrauenspersonen |
| Vorsorge-Check | Dokumentenübersicht |
| Einstieg: Übersicht und Notfallkarte | Nachlass- und Schuldeninformationen |
| Export, Löschen, Widerruf, Konto-Wiederherstellung (immer frei) | Persönliche Vorsorge- und Janazah-Wünsche, PDF-Exporte |

Bestandsschutz:
- Konten von vor dem Starttermin behalten alle Funktionen dauerhaft.
- Ohne Starttermin ist keine Sperre möglich.
- Daten werden nie wegen eines fehlenden Kaufs gesperrt oder gelöscht.

Wirksam sperrbar ist nur die Speicherung im Konto.

## 6. Anbieter und Kosten

Doku 21. Empfehlung: **Stripe Checkout** und **Brevo** (EU-Hosting), Postmark als Alternative.
- Stripe: ca. 2,6 % Gebühr je 39-€-Kauf (Mischkalkulation, ≈ 1,00 €).
- Mailkosten in allen Szenarien vernachlässigbar.

| Nutzer | Mail/Jahr | Stripe-Gebühren/Jahr (30 % Kaufquote, Annahme) |
|---|---|---|
| 100 | 0 € (Brevo Free) | ca. 30 € |
| 1.000 | 0 € (Brevo Free) bzw. 180 $ (Postmark) | ca. 300 € |
| 10.000 | ≤ 360 $ (Brevo Starter bei Spitzen) bzw. 180 $ (Postmark) | ca. 3.000 € |

Datenschutz-Besonderheit: Mails und Käufe lassen auf die Religionszugehörigkeit schließen (Art. 9). Deshalb: EU-Hosting, neutrale Produktnamen, kein Link-Tracking (Mailadapter erzwingen das).

## 7. Staging-Readiness

Doku 22: **technisch bereit, lokal geprobt, nicht deployt.**
- Eigenständiges Compose-Projekt, eigene Datenbank, App nur an localhost.
- Basic Auth über Caddy, noindex, Banner.
- Registrierung nur mit Testdomains, keine echten Mails.
- Testkonten-Skript, Monitoring- und Sicherheitsskripte.
- Rückrollplan und Testprotokoll.

Für den Betrieb fehlen Server-Entscheidung, DNS, Basic-Auth-Zugang und die Caddy-Änderung (Owner).

**Wichtiger Fund:** `docker-compose.prod.yml` gibt Datenschlüssel, Basis-URL, Mail und Billing nicht an die App weiter. Ein Deployment damit wäre faktisch ausgefallen (Speichern nicht möglich). Der Patch ist vorbereitet, aber nicht angewandt (A16).

## 8. Offene rechtliche und religiöse Freigaben

- **Recht (REQUIRES_LEGAL_REVIEW):**
  - Einwilligungs- und Kontotexte (inkl. Altkonten-Hinweis)
  - Datenschutzerklärung, DSFA (inkl. Art.-9-Bezug von Mail und Zahlung), AVVs
  - Löschfristen
  - AGB, Widerruf digitale Inhalte, Bestellbutton, Rechnung/USt
  - RDG-Abgrenzung der Testamentsvorbereitung
  - Wissensartikel 4, 5, 9, 10
  - Kanzleikooperation (§ 49b BRAO)
- **Religiös (REQUIRES_SCHOLAR_REVIEW):**
  - Alle zehn Startartikel (Prüfpakete mit 111 Fragen bereit) und 34 Altinhalte
  - Positionen der vier Schulen
  - Einstufungen
  - Regeln der Erbquoten-Engine
  - Prüfgremium
- **Lizenz (REQUIRES_OWNER):**
  - Schriftliche Bestätigung QuranEnc bzw. König-Fahd-Komplex
  - Meldung der zwei Textauffälligkeiten an QuranEnc

## 9. Technischer Restaufwand bis „Vorsorge Plus“

Etwa **7–10 PT** (vorher 8–12):

| Paket | PT | Stand |
|---|---|---|
| Patch Prod-Compose + Prisma-7-Merge + Release-Build | 0,5 | vorbereitet |
| Mailanbieter anbinden (Konto, DNS, Testversand) | 0,5 | Adapter fertig |
| Live-Zahlungsadapter Stripe + Testmodus | 2–3 | Sandbox fertig |
| Plus-Hinweise in allen Plus-Bereichen, `/preise` neu | 1–1,5 | Matrix fertig |
| Server: Staging/Produktion, Schlüssel, Backups-Cron, Alarmweg | 1–1,5 | Skripte fertig |
| Pilot und Fehlerbehebung | 2–3 | – |
| optional: serverseitiges PDF | 2 | – |

Dazu kommen externe Rechts-, Datenschutz- und Steuerarbeit (nicht schätzbar).

## 10. Go / No-Go

- **Öffentlicher Start: No-Go.** Es fehlen Rechts- und Datenschutztexte, Mail- und Zahlungsanbieter sowie A16.
- **Privater Pilot mit synthetischen Daten: Go**, sobald der Owner Server, DNS und Caddy freigibt. Die Technik ist bereit und geprobt; rechtliche Texte sind dafür nicht nötig, weil keine echten Personen beteiligt sind.
- **Pilot mit echten Nutzern: No-Go** bis B2–B5 erledigt sind.
- **Prisma 7: Go** für den Merge in den Integrationsbranch nach Owner-Freigabe.

### Freigaben, um die ich bitte (jeweils einzeln)

1. Push von `feat/vorsorge-testament-foundation` nach GitHub. Optional auch `chore/prisma-7`.
2. Fast-Forward-Merge `chore/prisma-7` → Integrationsbranch.
3. Patch A16 anwenden.
4. Prüf-Images entfernen (≈ 2,4 GB).
5. Server, DNS und Caddy für Staging.
6. Matrix, Preis und Starttermin für Plus bestätigen; Frist für Altkonten bestätigen.
