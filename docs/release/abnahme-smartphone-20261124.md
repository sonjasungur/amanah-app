# Abnahmeprotokoll Smartphone – Wasiyya (24.11.2026)

Gehört zu `docs/release/freigaben.json`, Eintrag `smartphone` („Abnahme auf echtem iPhone und Android“, Doku 43). Den Status in `freigaben.json` setzt nur die Betreiberin.

## 1. Rahmen

| Feld | Angabe | Quelle |
|---|---|---|
| Prüferin | Owner (Geschäftsführung der Betreiberin MSC Engineering GmbH) | Owner |
| Datum | 24.11.2026 | Owner-Nachricht, 24.11.2026 |
| Geprüfter Stand | Staging `amanah-staging-app:84f265a` (Release-Kandidat) | Staging-Deploy 24.11.2026 |
| Umgebung | https://amanah-test.mscisystems.com, für den Test vorübergehend ohne Staging-Passwort, nur synthetische Daten, Wissenszentrum geschlossen, Direktanmeldung aus | `AI_HANDOFF.md` §3, 24.11. |
| Ergebnis | „Test fertig. Ich habe alles geprüft, alles funktioniert. Wasiyya Staging ist abgenommen.“ | Owner-Nachricht 24.11.2026 |
| Gemeldete Mängel | keine | dito |

## 2. Echte Geräte (Abnahme durch die Prüferin)

| Gerät | Modell | Betriebssystem/Version | Browser | geprüft | Ergebnis |
|---|---|---|---|---|---|
| iPhone | **[ergänzen]** | **[ergänzen]** | **[ergänzen, z. B. Safari]** | **[ja/nein]** | **[ergänzen]** |
| Android | **[ergänzen]** | **[ergänzen]** | **[ergänzen, z. B. Chrome]** | **[ja/nein]** | **[ergänzen]** |

Nur Geräte eintragen, die tatsächlich benutzt wurden. Fehlt eines der beiden, bleibt die Freigabe `smartphone` offen (Bereich verlangt iPhone **und** Android).

## 3. Simulierte Browsertests (keine echten Geräte, nur ergänzender Nachweis)

| Lauf | Profil | Ergebnis | Beleg |
|---|---|---|---|
| Release-Check `84f265a`, Wiederholung 24.11.2026 16:53 | iPhone-Profil (WebKit im offiziellen Playwright-Container) | 3 bestanden | Release-Check-Protokoll `rc-retest` (laut Bericht, Logs im damaligen Scratchpad) |
| Release-Check `84f265a`, erster Lauf 24.11.2026 13:39 | Android-Emulation (Chromium) | 3 bestanden | Release-Check-Protokoll `rc-84f265a` (laut Bericht) |
| Staging-Abnahme `dfe8c4b`, 23.11.2026 | Chromium Desktop, Android-Emulation, Firefox, WebKit iPhone 13 und SE | 65/65 | `docs/qa/startfreigabe-20261123/1-staging/` (Hauptrepo, laut Bericht) |
| Ansichten 25.11.2026 | Chromium 390 px, Touch | kein waagrechtes Scrollen | `docs/qa/produktion-20261125/ap3-branding/ansichten/` |

Simulationen ersetzen keine Prüfung auf echten Geräten.

## 4. Eintrag in `freigaben.json` (setzt die Betreiberin, nach Ergänzung von §2)

```json
{ "id": "smartphone", "status": "freigegeben", "pruefer": "[Name der Prüferin]", "datum": "2026-11-24", "dokument": "docs/release/abnahme-smartphone-20261124.md" }
```

Alle anderen fünf Freigaben bleiben `offen`, bis die jeweilige Prüfung tatsächlich erfolgt ist.
