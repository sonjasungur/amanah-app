# Anbieterprüfung: Zahlung (Stripe) und Transaktionsmails (Brevo, Postmark)

Stand: 2026-10-31 · Desktop-Recherche, **keine Konten eröffnet, kein Kontakt** · Preise netto laut Anbieterseiten bzw. Sekundärquellen (siehe Quellen); vor Vertragsschluss beim Anbieter bestätigen.

## 0. Besonderheit von Amanah

Schon die Tatsache, dass jemand Mails von „Mein Wille – islamische Vorsorge“ erhält oder dort etwas kauft, lässt auf die Religionszugehörigkeit schließen (Art. 9 DSGVO, zumindest mittelbar). Daraus folgt:
- Mails enthalten nur Links und keine Ordnerinhalte (bereits so umgesetzt).
- Für Mails EU-Hosting bevorzugen.
- Produkt- und Rechnungsbezeichnung beim Zahlungsanbieter neutral halten (z. B. „Mein Wille Vorsorge Plus“, ohne „islamisch“).
- Abwägung durch die Datenschutzberatung (Teil der DSFA, B4).

## 1. Zahlung: Stripe

| Kriterium | Bewertung |
|---|---|
| Kosten (DE, Standardtarif, keine Grundgebühr) | EWR-Standardkarten 1,5 % + 0,25 €; EWR-Premiumkarten 2,8 % + 0,25 €; UK-Karten 2,5 % + 0,25 €; internationale Karten 3,15 % + 0,25 € (+2 % bei Währungsumrechnung); SEPA-Lastschrift 0,35 €; Klarna ab 2,99 % + 0,35 €; Rückbuchung (Dispute) 20 €. Stripe Tax per API 0,45 €/Transaktion (optional); Invoicing 0,4 % je bezahlter Rechnung. PayPal ist auf der Preisseite nicht beziffert. |
| DSGVO / AVV | Der DPA ist Teil der Stripe-Bedingungen; Vertragspartner außerhalb Amerikas ist Stripe Payments Europe Ltd. (Irland). Stripe ist teils Auftragsverarbeiter, teils eigener Verantwortlicher (Betrugsprävention, Produktverbesserung). Übermittlung in die USA über SCC. Meldung von Datenpannen spätestens nach 48 h. Die Rollenverteilung gehört in die Datenschutzerklärung (REQUIRES_LEGAL_REVIEW). |
| Technische Integration | Stripe Checkout (gehostete Zahlungsseite): Kartendaten berühren unseren Server nie (PCI SAQ A). Unser Sandbox-Ablauf (Checkout → Webhook → Statusmaschine → Freischaltung) ist darauf ausgelegt. Aufwand für den Live-Adapter: 2–3 PT (Checkout-Session, Webhook-Mapping, Erstattung, Testmodus-Lauf). |
| Webhooks | Signatur `Stripe-Signature: t=…,v1=HMAC-SHA256`: dasselbe Schema wie unsere Sandbox (`src/lib/billing/signature.ts`). Wiederholungen bis zu 3 Tage → Idempotenz über `payment_events` ist bereits vorhanden. |
| Zuverlässigkeit | Marktführer, Testmodus mit eigenen Schlüsseln, Statusseite. Risiko: Kontosperren bei unklarer Geschäftstätigkeit. Deshalb vor dem Start Geschäftsmodell und AGB sauber hinterlegen. |
| Alternative | Mollie (NL, EU-Unternehmen) wäre zu prüfen, wenn ein EU-Anbieter bevorzugt wird. Nicht Teil dieses Vergleichs. |

## 2. Transaktionsmails: Brevo vs. Postmark

| Kriterium | Brevo (Sendinblue, Frankreich) | Postmark (ActiveCampaign, USA) |
|---|---|---|
| Kosten | Free: 300 Mails/Tag (ca. 9.000/Monat), Brevo-Branding; Starter ab ca. 9 $/Monat für 5.000 Mails; höhere Stufen ca. 29–32 $ für 20.000 (Quellen uneinheitlich). | Developer: 100 Mails/Monat kostenlos (ohne Überschreitung); Basic 15 $/Monat für 10.000 Mails, danach 1,80 $ je 1.000; Pro 16,50 $ (1,30 $/1.000). |
| DSGVO / AVV | EU-Unternehmen; Hosting laut Anbieter überwiegend in der EU (OVH Frankreich/Deutschland, Google Cloud Belgien). DPA im Konto abschließbar; Subunternehmer im Anhang. | Daten in den USA (Rechenzentrum bei Chicago, AWS); keine EU-Region geplant. DPA mit SCC für alle Kunden. |
| Integration | REST-API v3 (`/smtp/email`) oder SMTP-Relay; Aufwand ca. 1 PT. | REST-API (`/email`) oder SMTP; getrennte „Message Streams“ für Transaktions- und Werbemails; Aufwand ca. 1 PT. |
| Webhooks | Ereignisse für Zustellung, Bounce, Spam-Beschwerde. | Ereignisse für Zustellung, Bounce, Spam-Beschwerde, Öffnung (abschaltbar). |
| Zustellbarkeit | Gut; Transaktions- und Marketingmails laufen auf gemeinsamer Plattform; dedizierte IP optional. | Sehr gut (Kernkompetenz, strenge Annahme von Absendern, transaktional getrennt). Dedizierte IP erst ab 300.000 Mails/Monat. |
| Datenhaltung | Logs gemäß Plan. | Nachrichten 45 Tage (Basic), bis 365 Tage (Pro). Für Amanah möglichst kurz einstellen. |
| Für Amanah | **Empfehlung:** EU-Hosting passt zum Art.-9-Kontext; Free-Plan deckt Pilot und frühen Betrieb ab. | Technisch die stärkste Wahl, aber US-Übermittlung muss in der DSFA begründet werden. |

SPF, DKIM und DMARC sind bei beiden Pflicht. Für die Absenderdomain braucht es Zugriff auf das DNS (REQUIRES_OWNER).

## 3. Betriebskosten-Szenarien

Annahmen (bitte durch den Owner ersetzen):
- Mails: pro neuem Nutzer 2 (Bestätigung, ggf. Hinweis), pro Kauf 1 Beleg, pro Jahr und Nutzer 0,3 Resets. Ergibt im ersten Jahr ca. 3,5 Mails je Nutzer.
- Kauf: 30 % der Nutzer kaufen Vorsorge Plus zu 39 € brutto (Annahme, keine Prognose).
- Zahlungsmix: 70 % EWR-Standardkarte (0,835 €), 20 % Premiumkarte (1,342 €), 10 % Klarna (1,516 €). Das ergibt ca. **1,00 € Gebühr je Verkauf (≈ 2,6 %)**.
- Ohne USt-Abführung, Steuerberatung, Hosting und Rückbuchungen.

| Nutzer (1. Jahr) | Mails/Jahr | Brevo | Postmark | Verkäufe | Umsatz brutto | Stripe-Gebühren | + Stripe Tax (optional, 0,45 €) |
|---|---|---|---|---|---|---|---|
| 100 | ca. 350 | 0 € (Free) | 0 $ (Developer) bis 15 $/Monat | 30 | 1.170 € | ca. 30 € | 13,50 € |
| 1.000 | ca. 3.500 | 0 € (Free) | 15 $/Monat = 180 $/Jahr | 300 | 11.700 € | ca. 300 € | 135 € |
| 10.000 | ca. 35.000 (Spitzen am Start) | Free reicht im Mittel; bei Spitzen über 300/Tag Starter ca. 9–30 $/Monat (≤ 360 $/Jahr) | 15 $/Monat = 180 $/Jahr | 3.000 | 117.000 € | ca. 3.000 € | 1.350 € |

Lesart: Die Mailkosten sind in jedem Szenario vernachlässigbar (< 0,5 % des Umsatzes). Die Stripe-Gebühren liegen bei ca. 2,6 % des Umsatzes. Wichtiger als der Preis sind EU-Hosting, AVV und Zustellbarkeit.

## 4. Empfehlung (Entscheidung beim Owner)

1. **Zahlung: Stripe Checkout** mit neutraler Produktbezeichnung; Karten + SEPA; Klarna optional. Stripe Tax erst nach Rücksprache mit der Steuerberatung.
2. **Mail: Brevo** (EU), Postmark als Rückfalloption bei Zustellproblemen.
3. Nächste Schritte nach Freigabe: Konten anlegen (Owner), AVV/DPA abschließen, DNS-Einträge, dann Adapter (Mail 1 PT, Zahlung 2–3 PT) und Testmodus-Lauf. Mailadapter für beide Anbieter sind bereits vorbereitet und nur gegen gemockte Antworten getestet (`src/lib/server/mail-providers.ts`).

## Quellen (abgerufen 31.10.2026)

- Stripe Preise DE: https://stripe.com/de/pricing
- Stripe DPA: https://stripe.com/legal/dpa
- Postmark Preise: https://postmarkapp.com/pricing
- Postmark EU-Datenschutz: https://postmarkapp.com/euprivacy · GDPR-FAQ: https://postmarkapp.com/support/article/1218-gdpr-faq
- Brevo DSGVO: https://help.brevo.com/hc/en-us/articles/360001258744-How-does-Brevo-comply-with-the-GDPR
- Brevo Preise (Sekundärquellen, offizielle Seite war nicht maschinell lesbar): https://www.emailtooltester.com/en/reviews/brevo/pricing/, https://moosend.com/blog/brevo-pricing/
