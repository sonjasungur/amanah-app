# Einwilligung, E-Mail-Bestätigung und Kontowiederherstellung

Stand: 2026-10-30 · technisch umgesetzt und getestet · **Rechtstexte = Entwürfe, nicht freigegeben** (REQUIRES_LEGAL_REVIEW)

## 1. Einwilligung (Art. 7, Art. 9 Abs. 2 lit. a DSGVO – Vorbereitung für die Datenschutzberatung)

| Anforderung | Umsetzung |
|---|---|
| Zweckgebunden, getrennt | Zwecke in `src/lib/consent/purposes.ts`: `sensitive_folder_storage` (Server-Speicherung des Ordners inkl. Gesundheits-/Religionsbezug), `external_ai_processing` (vorbereitet, Funktion aus) |
| Ausdrücklich, nicht vorangekreuzt | Checkbox leer, Button erst nach Ankreuzen aktiv; Server verlangt `confirmed === true` **und** die aktuelle Textversion |
| Nachweis | Tabelle `consent_records` (Zweck, Textversion, `granted_at`, `revoked_at`); Historie sichtbar in Einstellungen und im Kontoexport |
| Versionierung | neue Textversion → alte Einwilligung gilt nicht mehr, neue Einwilligung nötig |
| Durchsetzung | `PUT/PATCH /api/amanah` → 403 `consent_required` ohne aktive Einwilligung; Lesen, Export, Löschen bleiben möglich |
| Widerruf | Einstellungen → „Einwilligung widerrufen“ (mit Hinweis vorher); Server löscht die Ordnerdaten, Konto bleibt, Nachweis bleibt mit `revoked_at` |
| Konto löschen | löscht auch Einwilligungsnachweise (Cascade) – **Frage an DSB:** Nachweis für einen Zeitraum aufbewahren? |
| Einstellungsseite | vom Einwilligungsschritt ausgenommen, damit Export, Widerruf und Löschung immer erreichbar sind |

Offene Fragen für die Datenschutzberatung: endgültiger Einwilligungstext; Rechtsgrundlage für Angaben zu Dritten (Familie, Vertrauenspersonen); Aufbewahrung von Einwilligungsnachweisen nach Kontolöschung; DSFA; Hinweise bei Lokalmodus (keine Server-Verarbeitung).

## 2. E-Mail-Bestätigung

- Registrierung legt ein **unbestätigtes** Konto an und sendet einen Link (24 h, einmalig). **Keine Sitzung** vor der Bestätigung.
- Antwort ist für neue und vorhandene Adressen **identisch** (202 „Bitte prüfe dein Postfach“); bei vorhandener bestätigter Adresse geht eine „Konto existiert bereits“-Mail an die Adresse selbst.
- Login unbestätigter Konten → 403 `email_unverified` (nur mit korrektem Passwort erreichbar); „Bestätigungslink erneut senden“ (generische Antwort, 3/15 min je Adresse).
- Bestätigung meldet an (neue Sitzung, mitgebrachte wird verworfen).
- Migration `20261030125505_consent_and_auth_tokens` setzt **Bestandskonten** auf bestätigt (`email_verified_at = created_at`) → **Owner-Entscheidung**: Alternative wäre Bestätigungspflicht auch für Bestandskonten.
  - **Ersetzt am 31.10.:** Owner-Entscheidung gegen die pauschale Bestätigung; Altkonten durchlaufen eine Bestätigung mit Frist (Doku 19, Migration `20261031090000`).

## 3. Passwort-Reset

- Antrag: identische Antwort für bekannte/unbekannte Adressen; Link 30 min, einmalig; neuer Antrag entwertet alte Links; Rate-Limit 3/15 min je Adresse, 10/15 min je IP.
- Bestätigung: Mindestlänge, Token atomar eingelöst (auch bei parallelen Requests nur einmal, Postgres-Test), **alle Sitzungen widerrufen**, Cookie geleert, E-Mail gilt als bestätigt.
- Links nur aus `AMANAH_PUBLIC_BASE_URL`/Site-URL, nie aus dem Host-Header (Schutz gegen Reset-Link-Poisoning, getestet).
- Tokens nur als Hash gespeichert (`auth_tokens.token_hash`).

## 4. E-Mail-Versand

- `src/lib/server/mailer.ts`: `outbox` (Speicher, nur Entwicklung/Test) oder `disabled` (Standard in Produktion). **Kein echter Anbieter angebunden** → REQUIRES_OWNER (Anbieter, AVV, Absenderdomain, SPF/DKIM).
- Produktionsprüfung verbietet `outbox` und `AMANAH_INTERNAL_TOOLS=true`, verlangt Basis-URL, warnt ohne Mailversand.
- Dev-Postausgang `GET /api/dev/outbox` nur mit internen Werkzeugen und `outbox`, sonst 404.

## 5. Tests [geprüft 2026-10-30]

| Test | Ergebnis |
|---|---|
| `consent-and-recovery.test.ts` (15 Fälle: Einwilligung, Version, Widerruf, Export, Enumeration, Login-Sperre, Token einmalig/abgelaufen/zweckgebunden, Reset widerruft Sitzungen, neuer Link entwertet alten, Rate-Limit, Host-Header) | bestanden |
| `postgres-account.test.ts` gegen temporäre PostgreSQL 16.6 (Verifikation, paralleles Token-Einlösen, Ablauf/Zweck/Entwertung, Passwortwechsel widerruft Sitzungen, Einwilligungshistorie, Löschung) | bestanden |
| E2E API-Modus `security-session.spec.ts`: Registrierung → Postfach → Bestätigungslink → Einwilligung (nicht vorangekreuzt) → Speichern → CSRF → Logout-Replay → Passwort vergessen → neues Passwort → Export (inkl. Einwilligungen) → Löschung | bestanden |
