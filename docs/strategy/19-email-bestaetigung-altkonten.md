# E-Mail-Bestätigung für bestehende Konten (Altkonten)

Stand: 2026-10-31 · umgesetzt und getestet · ersetzt die pauschale Bestätigung aus Doku 16

## Problem

Migration `20261030125505` hat alle bis dahin bestehenden Konten als „E-Mail bestätigt“ markiert (`email_verified_at = created_at`). Der Owner hat entschieden: Altkonten dürfen nicht ohne Prüfung als bestätigt gelten. Sie sollen ihre Daten aber weiter erreichen.

## Lösung

Migration `20261031090000_legacy_email_verification` (die bereits veröffentlichte Migration bleibt unverändert):

- Neue Spalte `users.email_verification_legacy_at`.
- Jedes Konto mit `email_verified_at = created_at` (nur die pauschale Markierung erzeugt genau diesen Wert) wird zurückgesetzt: `email_verified_at = NULL`, `email_verification_legacy_at = Zeitpunkt der Migration`.
- Konten, die nach der Einführung der Bestätigung angelegt wurden, bleiben unberührt. Unbestätigte neue Konten können sich also weiterhin nicht anmelden, auch wenn sie nie einen Link erhalten haben (z. B. auf Testsystemen ohne Mailversand).

Zustände (`src/lib/server/email-verification.ts`):

| Zustand | Anmelden | Lesen, Export, Löschen | Ordner speichern | Kaufen |
|---|---|---|---|---|
| `verified` | ja | ja | ja | ja |
| `legacy_grace` (Altkonto, innerhalb der Frist) | ja | ja | ja | nein |
| `legacy_overdue` (Altkonto, Frist abgelaufen) | ja | ja | **nein** (403 `email_verification_required`) | nein |
| `unverified` (neues Konto) | nein (403 `email_unverified`) | – | – | – |

- Frist: `AMANAH_LEGACY_VERIFICATION_GRACE_DAYS` (Standard 60, erlaubt 0–365), gerechnet ab der Migration.
- Ablauf für Nutzer: Nach der Anmeldung zeigt das Dashboard einen Hinweis mit Frist und der Schaltfläche „Bestätigungslink senden“. Der Link geht nur an die gespeicherte Adresse; die Anfrage benötigt eine Sitzung, damit fremde Adressen nicht eingegeben werden können. Rate-Limits: 3 Mails pro Adresse und 10 Anfragen pro IP je 15 Minuten.
- Ein Passwort-Reset über das Postfach bestätigt die Adresse ebenfalls.
- Es werden keine Mails automatisch versendet. Eine Ankündigung an alle Altkonten wäre ein Versand an echte Nutzer und braucht eine eigene Freigabe.
- Der Export enthält `emailVerificationLegacyAt` (Nachweis, dass es sich um ein Altkonto handelt).

## Gefundene und behobene Fehler

1. `/api/auth/verify-email` antwortete mit dem Nutzerstand vor der Bestätigung. Mit Postgres sah die Oberfläche das Konto deshalb weiter als unbestätigt. Regressionstest in `postgres-account.test.ts`; er schlägt ohne die Korrektur fehl.
2. Eine verspätete Antwort von `/api/auth/me` konnte eine gerade übernommene Sitzung überschreiben (Bestätigungslink, Login). `AuthProvider` verwirft jetzt veraltete Antworten.

## Tests

- `legacy-email-verification.test.ts` (9): Zustände, Rechte, Frist-Parsing, Anmeldung, Schreibsperre nach Fristablauf, Export, Löschen, Link anfordern, Bestätigung, Reset.
- `postgres-legacy-migration.test.ts`: spielt alle Migrationen in einem Wegwerf-Schema nach (Altkonto vor Migration 1; bestätigtes, unbestätigtes und linkloses neues Konto danach).
- E2E `legacy-email-verification.spec.ts` (API-Modus + Postgres): Hinweis, Link senden, Bestätigung, Hinweis verschwindet; nach Fristablauf Lesen und Export erlaubt, Speichern 403.

## Offen

- REQUIRES_OWNER: Länge der Frist; ob Altkonten vor dem Start per Mail informiert werden (Versand an echte Nutzer).
- Hinweis an die Rechtsberatung: Der Hinweistext gehört zu den Kontotexten (B2/B3).
