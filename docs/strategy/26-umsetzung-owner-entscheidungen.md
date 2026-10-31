# Umsetzung der Owner-Entscheidungen vom 31.10. (Stripe, Prisma 7, A16, Staging, Plus)

Stand: 2026-10-31 · Agent: Claude Code · Grundlage: „Amanah – Aktualisierte Entscheidungen“
Nicht erfolgt: Deployment, Produktions- oder Serveränderung (Caddy, DNS), Merge nach `main`, echte Zahlung, Kontakt zu Stripe oder anderen Dritten, Veröffentlichung von Artikeln.

## Ergebnis je Entscheidung

| # | Entscheidung | Umsetzung | Beleg |
|---|---|---|---|
| 1 | Integrationsbranch nach Secret-Scan pushen | gitleaks über alle Branch-Commits ohne Funde, danach Push nach GitHub | siehe „Push“ unten |
| 2 | Prisma 7 nach Integration und Tests übernehmen | Fast-Forward `chore/prisma-7` (`d4bbc1e`) in den Integrationsbranch, danach alle Test-Ebenen erneut | Tests unten |
| 3 | Compose-Env-Patch anwenden und lokal prüfen | `244eaa8`; `docker compose config` mit Dummy-Werten: alle Variablen gesetzt; ohne Datenschlüssel Abbruch vor dem Start. Patch-Datei entfernt, weil angewandt. | Doku 22 §8 |
| 4 | Zwei Prüf-Images entfernen | Vorher geprüft: kein Container nutzt sie. Nur `amanah-p7-check:c5bf156` und `amanah-p7-migrate:c5bf156` entfernt; `/` danach 12 GB frei (81 %). | `docker rmi` mit Namen, kein prune |
| 5 | Geschützte Staging-Konfiguration vorbereiten | Staging kann Stripe-Testmodus nutzen; Caddy-Snippet nimmt nur den Webhook von Basic Auth aus; Sicherheitscheck prüft unsignierte Webhooks. Keine Server-, DNS- oder Caddy-Änderung. | Doku 22, 25 |
| 6 | Plus 39 € Testpreis, Bestandsschutz, Frist 60 Tage | War technisch schon Standard. Jetzt als Owner-Entscheidung dokumentiert; `/preise` und Startseiten-Teaser zeigen Kostenlos + Vorsorge Plus 39 € („In Vorbereitung“, kein Kaufknopf). | `1b7e19e`, Doku 19, 20 |
| – | Stripe für Amanah | Testmodus-Adapter (Checkout + Webhook), Live-Schlüssel überall abgelehnt; Anleitung für eigenes Konto unter demselben Login, benötigte Schlüssel und Angaben | `277b296`, **Doku 25** |

## Tests (alle selbst ausgeführt am 31.10. nachmittags, Integrationsbranch mit Prisma 7.10.1)

| Ebene | Ergebnis |
|---|---|
| tsc, ESLint | ok |
| Vitest (ohne DB) | 519 bestanden, 13 übersprungen (Postgres-Dateien). Neu: 12 Stripe-Tests, nur gegen gemockte Antworten |
| Vitest Postgres (temporäre PostgreSQL 16.6 im RAM, `migrate deploy` + `migrate status` „up to date“) | Postgres-, Billing- und Stripe-Dateien: 40/40 |
| Playwright lokal (Desktop + Mobil) | 239 bestanden, 73 übersprungen (API-only) |
| Playwright API-Modus + Postgres + Billing-Sandbox + CSP + Altkonten | 61 bestanden, 9 übersprungen (Mobil-Duplikate) |
| Verschlüsselung in API-Modus-Build | 2 synthetische Konten über `seed-staging-accounts.mjs`: 2/2 Ordner `amanah-aes256gcm-v1`, kein Klartext |
| `npm audit --omit=dev` | 0 Schwachstellen |
| Mutationsprobe Stripe (Live-Prüfung, Mehrfach-`v1`, Anbieterprüfung entfernt) | jeweils Tests rot, danach zurückgesetzt |
| `/preise` Desktop 1280 px und Mobil 390 px | kein Querscrollen, Karten lesbar (Screenshots nur lokal) |
| Docker-Build auf diesem Stand | **NOT_RUN**: Dockerfile seit dem grünen Prisma-7-Container-Test (`c5bf156`) unverändert; neue Images hätten ohne Freigabe erneut Platz belegt |
| Stripe-Testmodus gegen echtes Stripe | **NOT_RUN**: noch kein Amanah-Konto und keine Testschlüssel (Owner-Schritt, Doku 25 §1) |

Hinweis: Ein Vitest-Gesamtlauf **mit** gesetzter `DATABASE_URL` meldet einen erwarteten Fehler in `auth.test.ts` (prüft „keine DB konfiguriert“). Deshalb laufen die Postgres-Dateien wie bisher getrennt. Ein Stripe-Test nutzte zunächst eine feste Ereignis-ID, die in Postgres über Läufe hinweg bestehen bleibt; er nutzt jetzt eine zufällige ID.

## Stripe – was der Owner jetzt tun kann

1. Im bestehenden Stripe-Login: Kontoname → **„Neues Konto“** → „Mein Wille (Amanah)“ (Doku 25 §1).
2. Im **Testmodus** des neuen Kontos:
   - eingeschränkten Schlüssel `rk_test_…` mit Recht „Checkout Sessions: Schreiben“ anlegen
   - Webhook-Endpoint für Staging mit den fünf Ereignissen anlegen; daraus `whsec_…`
3. Beide Werte nur in `.env.staging` auf dem Server eintragen, nicht an Agenten weitergeben. Danach `validate-staging-env.mjs` ausführen.
4. Vor echten Zahlungen: Live-Modus im Code (eigene Freigabe), AGB/Widerruf/Rechnung (C6), Kontoaktivierung mit Unternehmensangaben (Doku 25 §2b).

## Offene Punkte (unverändert REQUIRES_OWNER / LEGAL)

- Server, DNS, Caddy für Staging (F6, A13)
- Rechts- und Datenschutztexte, DSFA, AVVs (B2–B5, B7, C6)
- Mailanbieter (A6)
- Plus-Starttermin und Freigabe der Sperren (C2, E6)
- Freigabe der neuen Texte auf `/preise` vor einer Veröffentlichung (C9)
- Fachprüfung der Artikel, QuranEnc-Lizenz (D3–D5)

**Go/No-Go unverändert:** öffentlicher Start No-Go; privater Pilot mit synthetischen Daten Go nach Freigabe von Server, DNS und Caddy. Neu möglich: Stripe-Testkäufe auf Staging, sobald die Testschlüssel des Amanah-Kontos eingetragen sind.
