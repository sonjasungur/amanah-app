# Offene Punkte vor einer möglichen Produktionsfreigabe

Stand: 2026-10-30 · Branch `feat/vorsorge-testament-foundation` (lokal, 15 Commits seit `main` @ `1fdb5db`, **nicht gepusht**)
Details: [06 Sicherheit/Tests](06-sicherheit-und-tests.md) · [07 Prisma 7](07-prisma7-analyse.md) · [08 Vorsorge Plus](08-vorsorge-plus.md) · [09 Quellenkorrektur](09-quellenkorrektur.md) · [10 Redaktionsplan](10-redaktionsplan.md)

## A. Entscheidungen und Freigaben des Owners

1. Review und Push/Merge des Branches (inkl. Abgleich GitLab `origin`, dort 16 Commits Rückstand auf `main`).
2. Schriftliche Nutzungsbestätigung für Bubenheim/Elyas (QuranEnc/Rechteinhaber); Freigabe, QuranEnc zwei Textfehler zu melden.
3. Prüfgremium benennen: Quellenprüfer, Gelehrte (Rechtsschulen), Jurist für Bereich E.
4. Datenschutzberatung/DSB und Anwalt für Datenschutzerklärung, Art.-9-Einwilligung, AGB, Widerruf.
5. Zahlungsanbieter auswählen (Testmodus zuerst).
6. Echte Domain für Caddy (`deploy/Caddyfile` ist Platzhalter) und Sicherheitskontakt in `SECURITY.md`.

## B. Technik (Blocker)

| # | Punkt | Aufwand |
|---|---|---|
| B1 | Art.-9-Einwilligung mit Nachweis (`ConsentRecord`, Migration) | 1,5 PT |
| B2 | Verschlüsselung at rest + verschlüsselte Backups (Plan in 06) | 3–4 PT |
| B3 | E-Mail-Verifikation, Passwort-Reset (E-Mail-Anbieter + AVV) | 3 PT |
| B4 | Prisma 7.10.1 + Node 22/24 im Docker-Image, eigener Branch | 1–1,5 PT |
| B5 | Postgres-Integrationstest und Docker-Build lokal ausführen (bisher `NOT_RUN`) | 0,5 PT |
| B6 | Origin-Prüfung hinter Caddy mit echter Domain verifizieren | 0,25 PT |
| B7 | Billing-Adapter, Webhook, Entitlements (nur Testmodus) | 4–5 PT |

## C. Technik (empfohlen)

CSP mit Nonces, 2FA, Rate-Limit über mehrere Instanzen, `/api/health` auf Minimalangaben reduzieren, serverseitiges PDF, Lesezeichen im Wissenszentrum, Sitemap für veröffentlichte Artikel.

## D. Inhalte

- Wissenszentrum: 0 veröffentlichte Artikel (bewusst). Erste Welle nach [10](10-redaktionsplan.md) mit dokumentierten Prüfungen.
- Fiqh-Quellen und Behörden-URLs ersetzen; BGB-Verweise in Praxis-Topics juristisch aktualisieren.
- Hadith-Wiedergaben fachlich abnehmen oder durch qualifizierte Übersetzung ersetzen.

## E. Bewusst gesperrt (bleibt so bis zur Freigabe)

- Farāʾiḍ-Berechnung (Regelwerk `unreviewed_draft`, Flag aus, keine UI).
- Testamentsfunktionen über das Erbprofil mit neutralen Hinweisen hinaus.
- Echte Zahlungen, KI-Veröffentlichung, Veröffentlichung ungeprüfter religiöser Inhalte.
