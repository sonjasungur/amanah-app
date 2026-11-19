# Stripe für Amanah – Einrichtung, benötigte Angaben und Schlüssel

Stand: 2026-10-31. Owner-Entscheidung vom 31.10.: Amanah nutzt Stripe, und zwar mit einem **eigenen Stripe-Konto unter dem bestehenden Stripe-Login** (dort ist bereits Nasib Nikah). Keine Neuregistrierung, keine echten Zahlungen, keine Nasib-Nikah-Schlüssel.

**Umgesetzt (nur Testmodus):** Stripe-Checkout-Adapter, Webhook, Validatoren, Staging-Vorlagen. Getestet nur gegen Mocks; Stripe wurde nicht kontaktiert. Ein Live-Modus ist im Code **nicht** vorhanden, Live-Schlüssel werden überall abgelehnt.

## 1. Eigenes Amanah-Konto unter demselben Login (Owner-Schritt)

Laut Stripe-Doku („Mehrere separate Konten“, docs.stripe.com/get-started/account/multiple-accounts):
1. Im Dashboard oben links auf den Kontonamen klicken und **„Neues Konto“** wählen. Stripe verlangt dafür keine neue Registrierung; das Konto hängt an derselben Login-E-Mail.
2. Kontoname z. B. „Mein Wille (Amanah)“. Über denselben Menüpunkt wechselt man zwischen Nasib Nikah und Amanah.
3. Jedes Konto hat **eigene API-Schlüssel, eigene Webhooks, eigene öffentliche Unternehmensangaben und eine eigene Zahlungsbeschreibung auf dem Kontoauszug**. Schlüssel von Nasib Nikah funktionieren für Amanah deshalb nicht und dürfen nicht verwendet werden.
4. Gehören beide Projekte zur selben juristischen Person, dürfen Steuernummer und Unternehmensdaten gleich sein. Die **öffentlichen** Angaben müssen aber zu Amanah passen, damit Käufer die Abbuchung erkennen (sonst Rückbuchungsrisiko).
5. Optional: eine Stripe-**Organisation** für gemeinsame Berichte über beide Konten.
6. Teamzugriff: Wer am Amanah-Konto arbeiten soll, wird dort eigens eingeladen. Rechte am Nasib-Nikah-Konto gelten nicht automatisch.

Für Tests genügt der Testmodus (bzw. eine Sandbox) des neuen Kontos. Die Aktivierung für echte Zahlungen (Identitätsprüfung, Bankkonto) ist **erst vor dem Live-Start** nötig und braucht eine eigene Freigabe.

## 2. Was wir später vom Amanah-Konto benötigen

### 2a. Schlüssel und Werte für die App

| Variable | Wert | Woher | Jetzt nötig? |
|---|---|---|---|
| `AMANAH_BILLING_MODE` | `stripe_test` | – | für Staging-Tests mit Stripe |
| `AMANAH_STRIPE_SECRET_KEY` | **Eingeschränkter Testschlüssel** `rk_test_…` (empfohlen) oder `sk_test_…` | Amanah-Konto → Entwickler → API-Schlüssel → „Eingeschränkten Schlüssel erstellen“, Rechte: **Checkout Sessions: Schreiben**, sonst nichts | ja (Staging) |
| `AMANAH_STRIPE_WEBHOOK_SECRET` | Signaturgeheimnis `whsec_…` des Staging-Endpoints | Amanah-Konto → Entwickler → Webhooks → Endpoint → „Geheimschlüssel anzeigen“ | ja (Staging) |
| Konto-ID `acct_…` | nicht geheim | Einstellungen → Konto | nur zur Dokumentation: belegt, dass die Schlüssel zum Amanah-Konto gehören |
| Veröffentlichbarer Schlüssel `pk_…` | – | – | **nicht nötig**: Die Kasse liegt bei Stripe, die App leitet nur weiter |

Live-Schlüssel (`sk_live_`, `rk_live_`, `pk_live_`) sind **erst** nötig, wenn ein Live-Modus implementiert und freigegeben ist. Heute lehnen App und Validatoren sie ab.

### 2b. Angaben für das Stripe-Konto (vor dem Live-Start)

| Bereich | Angabe | Hinweis |
|---|---|---|
| Unternehmen | Rechtsform, Name, Anschrift, Steuernummer/USt-IdNr., Vertretungsberechtigte (Identitätsprüfung) | wie im Impressum |
| Auszahlung | Bankkonto (IBAN) | darf dasselbe sein wie bei Nasib Nikah |
| Öffentliche Angaben | Name „Mein Wille“, Website, Support-E-Mail und optional Telefon | Support-Prozess ist noch offen (Doku 13, C8) |
| Kontoauszug | Zahlungsbeschreibung, 5–22 Zeichen, z. B. `MEIN WILLE` | **neutral**, ohne religiösen Bezug (Doku 21 §0: schon der Kauf kann auf die Religion schließen lassen) |
| Produkt | Beschreibung „Digitale Vorsorgemappe (Software), Einmalkauf“ | Branche: Software / digitale Güter |
| Checkout | Logo, Farbe, Links zu Datenschutz und AGB | AGB und Widerruf: REQUIRES_LEGAL_REVIEW (C6) |
| Zahlungsarten | Start: Karte, Apple Pay/Google Pay. SEPA-Lastschrift nur bewusst | SEPA ist **verzögert**; der Code wartet dafür auf `async_payment_*` (siehe 4) |
| Kundenbelege | Stripe-Belege per E-Mail an/aus | Rechnungen über Stripe kosten extra; Rechnungsstellung offen (C6) |
| Steuer | USt-Behandlung digitaler Leistungen, ggf. Stripe Tax (kostenpflichtig) | steuerliche Beratung nötig |
| Datenschutz | Stripe-DPA im Dashboard akzeptieren, im Verzeichnis der Verarbeitungstätigkeiten aufnehmen | B4/B5 |

## 3. Webhook-Endpoint (Owner-Schritt im Amanah-Konto, Testmodus)

- URL: `https://staging.<domain>/api/billing/webhook`
- API-Version des Endpoints: **`2026-10-28.endive`**. Die App sendet ihre Anfragen mit derselben Version (`src/lib/billing/stripe.ts`).
- Ereignisse, nur diese fünf:
  - `checkout.session.completed`
  - `checkout.session.async_payment_succeeded`
  - `checkout.session.async_payment_failed`
  - `checkout.session.expired`
  - `charge.refunded`
- **Basic Auth:** Stripe kann sich am Staging-Caddy nicht anmelden. `deploy/Caddyfile.staging-snippet` nimmt deshalb **nur** `/api/billing/webhook` von der Basic Auth aus. Dort akzeptiert die App nur POST mit gültiger `Stripe-Signature`; `staging-security-check.sh` prüft, dass unsignierte Ereignisse abgelehnt werden.

## 4. Ablauf in der App

1. „Vorsorge Plus testen (Stripe-Testmodus)“ → `POST /api/billing/checkout`.
   - Voraussetzungen: angemeldet, E-Mail bestätigt (Doku 19).
   - Es entsteht ein offener Kauf mit Referenz `amn_<uuid>`.
   - Die App erzeugt die Checkout Session (`Idempotency-Key`, 31 Minuten gültig) und leitet zu `checkout.stripe.com` weiter.
2. **An Stripe geht nur:** Produktname, Betrag (3900 Cent, EUR) und die Referenz. Keine E-Mail, kein Name, nichts aus der Vorsorgemappe; Kartendaten erfasst Stripe selbst.
3. Rückkehr auf `/kasse/ergebnis`. Diese Seite zeigt nur, was der Server weiß; die Weiterleitung selbst schaltet **nichts** frei.
4. Freigeschaltet wird ausschließlich über den signierten Webhook:

| Ereignis | Wirkung |
|---|---|
| `checkout.session.completed`, bezahlt | Kauf → bezahlt |
| `checkout.session.completed`, unbezahlt (z. B. SEPA) | warten |
| `async_payment_succeeded` | bezahlt |
| `async_payment_failed`, `expired` | fehlgeschlagen |
| `charge.refunded`, voll erstattet | erstattet (Zuordnung über `GET /v1/checkout/sessions?payment_intent=…`) |
| `charge.refunded`, teilweise erstattet | ignoriert (Supportfall) |
| andere Typen | quittiert und ignoriert |

Schutzmechanismen, je mit Test in `src/__tests__/stripe-billing.test.ts`:
- Signaturprüfung, auch mit mehreren `v1` beim Wechsel des Geheimnisses; 5 Minuten Toleranz.
- Live-Ereignisse und Live-Antworten werden abgelehnt.
- Betrag und Währung müssen zum Kauf passen.
- Jedes Ereignis wird nur einmal verarbeitet.
- Ein Anbieter darf nur seine eigenen Käufe ändern: Ein Sandbox-Ereignis ändert keinen Stripe-Kauf.
- Ein fehlerhafter Stripe-Aufruf markiert den Kauf als fehlgeschlagen. Geloggt wird nur der HTTP-Status, nie die Antwort.
- Schlägt die Erstattungs-Zuordnung fehl, antwortet die App mit 503; Stripe wiederholt das Ereignis.

Mutationsprobe 31.10. (danach zurückgesetzt): Ohne Live-Prüfung, ohne Mehrfach-`v1` oder ohne Anbieterprüfung schlagen jeweils Tests fehl.

## 5. Test im Stripe-Testmodus (nach Einrichtung, je mit Freigabe)

1. `.env.staging`: `AMANAH_BILLING_MODE=stripe_test` sowie die beiden Werte aus 2a. Danach `node scripts/validate-staging-env.mjs`; der Validator lehnt Live-Schlüssel und fehlende Werte ab.
2. Testkarten von Stripe: `4242 4242 4242 4242` (Erfolg), `4000 0000 0000 0002` (abgelehnt), `4000 0025 0000 3155` (3-D Secure). Beliebiges künftiges Ablaufdatum und beliebige Prüfziffer.
3. Protokoll (Doku 22 §7, Zeile „Plus“):
   - Erfolg
   - Ablehnung
   - Abbruch
   - Ablauf nach 31 Minuten
   - Vollerstattung im Dashboard → Status „erstattet“
   - Teilerstattung → bleibt „bezahlt“
4. Lokal ohne Staging möglich: `stripe listen --forward-to localhost:3000/api/billing/webhook` (Stripe CLI, mit dem Owner-Login). Das ausgegebene `whsec_…` gilt nur für diese CLI-Sitzung.

## 6. Umgang mit den Schlüsseln

- Nur in `.env.staging` auf dem Server (Rechte 600) bzw. später `.env.production`. Nie im Repository, in Tickets, Chats oder `AI_HANDOFF.md`.
- Eingeschränkter Schlüssel statt Standard-Geheimschlüssel: Gelangt er nach außen, kann er nur Checkout Sessions anlegen und lesen.
- Testschlüssel für Staging und spätere Live-Schlüssel getrennt erzeugen. Beim Personalwechsel oder Verdacht rotieren (Dashboard → Schlüssel rollen; Webhook-Geheimnis mit bis zu 24 h Übergang).
- Validator-Ausgaben zeigen Stripe-Werte nur als `[set]`.

## 7. Noch offen bis zu echten Zahlungen (je REQUIRES_OWNER bzw. LEGAL)

1. Live-Modus im Code (bewusst nicht gebaut), mit eigener Freigabe.
2. AGB, Widerrufsbelehrung für digitale Inhalte inklusive ausdrücklicher Zustimmung zum vorzeitigen Beginn, Bestellbutton „zahlungspflichtig bestellen“, Rechnung und USt (C6).
3. Aktivierung des Amanah-Kontos (2b), DPA, Eintrag in der DSFA.
4. Plus-Starttermin `AMANAH_PLUS_LAUNCH_AT` und Freigabe der Plus-Sperren (E6).
5. Webhook-Endpoint für Produktion; Prüfung von Stripe-IP-Allow-List im Caddy (optional).
