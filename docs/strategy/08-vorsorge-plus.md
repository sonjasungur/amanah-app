# Vorsorge Plus – verbleibende Anforderungen vor dem ersten kostenpflichtigen Produkt

Stand: 2026-10-30 · Keine Zahlung aktiviert, kein Anbieter kontaktiert. Rechtliche Punkte sind **Prüfaufträge**, keine Rechtsauskunft.

## 1. Produktzuschnitt

Eigenständig nutzbarer, digitaler Vorsorgeordner – **ohne** Rechtsberatung, ohne Erbquoten, ohne Testamentserstellung.

| Enthalten | Bereits im Code | Lücke |
|---|---|---|
| Notfallkarte, Krankheit/Vollmacht-Hinweise | ja | – |
| Janazah-Wünsche (geführt, Vorschau) | ja | – |
| Dokumentenübersicht (wo liegt was) | ja, als Ortshinweise | Status je Dokument (vorhanden/fehlt/zu prüfen) |
| Familienbrief | ja (Vorlage) | – |
| Export (Druck/PDF, JSON, Konto-Export) | ja | serverseitiges PDF optional |
| Server-Speicherung mit Konto | ja (Cookie-Sessions) | Verschlüsselung at rest, Einwilligung Art. 9 |
| Islamisches Wissen | kostenlos für alle | **nie** Teil des Bezahlprodukts |

Nicht enthalten: Testament-Vorbereitung mit Quoten, Anwaltsprüfung (spätere Produkte).

## 2. Prüfliste vor Freigabe

### AGB und Datenschutz (extern: Anwalt, DSB)
- [ ] AGB inkl. Leistungsbeschreibung „Software zur Dokumentation, keine Rechts-, Medizin- oder religiöse Beratung“
- [ ] Datenschutzerklärung vollständig (siehe [06](06-sicherheit-und-tests.md) Abschnitt 2)
- [ ] DSFA, Verzeichnis von Verarbeitungstätigkeiten, AVV mit Hoster und Zahlungsanbieter
- [ ] Ausdrückliche Einwilligung Art. 9 vor Server-Speicherung (Technik: `ConsentRecord`)

### Technische Sicherheit
- [x] Cookie-Sessions, CSRF, Fixation, Logout, Rate-Limit, Header (Branch)
- [ ] Verschlüsselung at rest + verschlüsselte Backups (Plan in 06, ca. 3–4 PT)
- [ ] E-Mail-Verifikation und Passwort-Reset (benötigt E-Mail-Versand → Anbieter/AVV, ca. 3 PT)
- [ ] Optional 2FA (TOTP, ca. 2 PT)
- [ ] Prisma 7 + Node 22/24 (ca. 1–1,5 PT, siehe 07)
- [ ] CSP mit Nonces (ca. 1 PT)
- [ ] Rate-Limit über mehrere Instanzen (erst bei Skalierung)

### Zahlung und Widerruf
- [ ] Anbieter wählen (z. B. Stripe oder Mollie; Gebühren und Vertrag beim Anbieter prüfen, nicht hier angenommen)
- [ ] Einmalzahlung per gehosteter Checkout-Seite (keine Kartendaten auf eigenem Server)
- [ ] Webhook mit Signaturprüfung → `Entitlement` (userId, productId, source, grantedAt); Freischaltung nur deterministisch über Webhook, nie über Client
- [ ] Bestellbutton „zahlungspflichtig bestellen“ (§ 312j BGB) und Pflichtinformationen
- [ ] Widerruf bei digitalen Inhalten: Erlöschen des Widerrufsrechts nur mit ausdrücklicher Zustimmung und Bestätigung (§ 356 Abs. 6 BGB, dazu § 356a BGB; Korrektur 01.11., Doku 32) → Text und Ablauf **anwaltlich prüfen**
- [ ] Rechnung/USt (Rechnungsstellung über Anbieter oder eigenes Tool), Kleinunternehmer-/OSS-Fragen mit Steuerberatung
- [ ] Erstattungsprozess und Rückbuchung (Entitlement entziehen, Daten bleiben exportierbar)
- [ ] Testmodus des Anbieters; **keine echten Zahlungen ohne Freigabe**

### Datenexport und Löschung
- [x] Konto-Export und vollständige Löschung (Branch)
- [ ] Löschfristen für Backups und Zahlungsbelege (handels-/steuerrechtliche Aufbewahrung getrennt von Vorsorgedaten)

### Support
- Erwartete Anfragen: Login/Passwort, Export/Druck, Zahlung/Rechnung, Löschung, inhaltliche Fragen (religiös/rechtlich → Verweis, keine Beratung).
- Aufwand grob: 1–3 % der Käufer mit Anfrage; Startbetrieb über E-Mail mit Textbausteinen; ca. 2–4 Stunden/Woche bei einigen hundert Kunden (Schätzung, nicht belegt).
- Sicherheitskontakt in `SECURITY.md` ist noch Platzhalter.

### Abgrenzung zu Rechtsdienstleistungen
- Keine individuellen Aussagen zu Wirksamkeit, Pflichtteil, Erbquoten.
- Testament-Bereich bleibt Erbprofil mit neutralen Hinweisen („kein Testament“, § 2247-Hinweis im Druck).
- Werbetexte ohne „rechtssicher“, „rechtsgültig“, „geprüft“ ohne Prüfer.

## 3. Technischer Aufwand bis Vorsorge Plus

| Paket | PT |
|---|---|
| Einwilligung Art. 9 + `ConsentRecord` + Migration | 1,5 |
| Verschlüsselung at rest + Backups | 3–4 |
| E-Mail-Verifikation, Reset | 3 |
| Billing-Adapter (Testmodus), Webhook, Entitlements, Bestellstrecke | 4–5 |
| Dokumentenstatus | 1–2 |
| Prisma 7 / Node | 1–1,5 |
| CSP | 1 |
| E2E + Docker-Build + Restore-Probe | 2 |
| **Summe** | **ca. 17–21 PT** (ohne externe Rechts-/DSB-Arbeit) |
