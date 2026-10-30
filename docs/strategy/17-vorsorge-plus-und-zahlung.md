# Vorsorge Plus und Zahlungs-Sandbox

Stand: 2026-10-30 · technisch umgesetzt und getestet · **keine echte Zahlung möglich** (kein Live-Modus im Code)

## 1. Produkte (`src/lib/billing/products.ts`)

| Produkt | Preis | Status |
|---|---|---|
| Mein Wille Basis | kostenlos | aktiv |
| Vorsorge Plus | **Testpreis** 29 € (Standard) oder 39 € (`AMANAH_TEST_PRICE_VORSORGE_PLUS_CENTS=3900`), andere Werte werden ignoriert | in der Sandbox buchbar |
| Testament-Vorbereitung | – | gesperrt (RDG-Prüfung, Owner-Freigabe) |
| Testament mit juristischer Prüfung | – | gesperrt (Kanzleikooperation offen) |

Das islamische Wissenszentrum ist in keinem Produkt enthalten und bleibt frei.

**Funktionsabgrenzung Basis/Plus:** vorbereitet über `PlusGate` (z. B. vollständiger PDF-Ordner). Mit `AMANAH_BILLING_ENFORCE` (Standard: aus) wird **nichts** gesperrt. Welche Funktionen Plus sind, entscheidet der Owner (REQUIRES_OWNER). Hinweis: Druck/PDF entsteht im Browser; eine wirksame Sperre ist nur für serverseitige Leistungen (z. B. Konto-Speicherung) möglich.

## 2. Zahlungsablauf

```
Einstellungen → POST /api/billing/checkout (Kauf „pending“, Referenz sbx_…)
→ /kasse/sandbox (Hinweis TESTMODUS) → POST /api/billing/sandbox/complete
→ signiertes Ereignis → derselbe Prüfpfad wie POST /api/billing/webhook
→ Statusmaschine → Freischaltung (Entitlement = bezahlter Kauf)
```

- **Signatur:** `t=<Unix-Zeit>,v1=<HMAC-SHA256(t.payload)>`, Zeitfenster 5 min, konstanter Vergleich (Stripe-kompatibles Schema).
- **Idempotenz:** Ereignis-ID in `payment_events` (Unique-Constraint); Wiederholungen → `duplicate`.
- **Statusmaschine:** pending/failed → paid; pending → failed; paid → refunded; alles andere `ignored_transition`.
- **Betragsprüfung:** Ereignis muss Betrag und Währung des Kaufs tragen.
- **Zugriff:** nur eigene Käufe (Sandbox-Abschluss, Testbeleg); Status-API gibt keine Nutzer-ID aus.
- **Testbeleg:** `/api/billing/receipt/<ref>` – „TESTBELEG – keine Rechnung“, keine Kundendaten.
- **Kontolöschung:** Käufe bleiben anonymisiert (`user_id = NULL`) – Aufbewahrungspflichten: REQUIRES_LEGAL_REVIEW.
- **Produktion:** `AMANAH_BILLING_MODE=sandbox` wird von der Produktionsprüfung abgelehnt; ohne Modus ist Billing aus (Webhook 404, Checkout 503).

## 3. Für einen echten Anbieter (REQUIRES_OWNER)

Anbieterwahl (z. B. Stripe/Mollie), Vertrag, AVV, Webhook-Secret als Server-Secret, Adapter `createCheckout` gegen die Anbieter-API, Signaturprüfung des Anbieters (bei Stripe dasselbe Schema), Rechnungsstellung, USt, Widerrufsbelehrung für digitale Inhalte (§ 356 Abs. 5 BGB), Bestellbutton (§ 312j BGB), AGB. **Keine Live-Schlüssel im Repo.**

## 4. Tests [geprüft 2026-10-30]

| Test | Ergebnis |
|---|---|
| `billing.test.ts` (Signatur, Testpreise, Kauf → Freischaltung, Fehlschlag/Retry/Erstattung, Doppelkauf, Replay/Idempotenz, Betragsmanipulation, unsignierte Webhooks, gesperrte Produkte, Billing aus, Fremdzugriff, Anonymisierung) | 8/8 |
| `postgres-account.test.ts` (bedingte Statuswechsel, Unique-Idempotenz, `ON DELETE SET NULL`) | bestanden |
| E2E API-Modus + Postgres: Einstellungen → Sandbox-Kasse → Testzahlung → „freigeschaltet (Test)“ | bestanden |
