# Smartphone-Abnahme (Vorlage)

**Für:** Owner oder beauftragte Testperson, ohne technische Vorkenntnisse. **Voraussetzung:** Testumgebung mit synthetischen Daten; keine echten persönlichen Angaben eintragen. Zugang und Testadresse nennt der Betrieb.

Automatisiert läuft bisher nur das Chromium-Mobilprofil. Echte Geräte, Safari und Tastaturen deckt nur dieser Test ab.

## Vorbereitung durch den Betrieb

Echte Telefone erreichen keine nur lokal gebundene Instanz, und Safari verlangt für sichere Cookies HTTPS. Vor dem Termin muss deshalb eines geklärt sein:

| Weg | Voraussetzung | Einschränkung |
|---|---|---|
| Staging mit Domain, HTTPS und Basic Auth (Doku 29 §4.3) | Domain vom Owner, eigene Freigabe für Proxy-Änderung | am realistischsten, öffnet aber einen Zugang |
| Privates Netz (etwa WireGuard) zum Testrechner | Einrichtung auf den Geräten, eigene Freigabe | kein öffentlicher Zugang, Zertifikat muss vertraut werden |

**Nicht verwenden:** die alte Route, `gemeinsam1.com` als Umweg und Produktionsdaten. Für den Termin: Instanz mit Mail-Outbox oder fest vereinbartem Testpostfach, je Gerät ein synthetisches Testkonto, Stand und Digest im Ergebnis notieren.

## Geräte

| Gerät | Browser | Modell und Version | Datum | Prüfer |
|---|---|---|---|---|
| iPhone (aktuelles iOS) | Safari | | | |
| iPhone, kleines Display oder älteres iOS | Safari | | | |
| Android (aktuell) | Chrome | | | |
| Android, einfaches Gerät | Chrome | | | |

## Prüfpunkte

Je Gerät ankreuzen: ja, nein, mit Foto bei Fehlern.

**Konto**
1. Registrieren, Bestätigungsmail öffnen, wird angemeldet.
2. Abmelden und wieder anmelden. Passwort-Manager und automatisches Ausfüllen funktionieren.
3. Seite 10 Minuten im Hintergrund, dann zurück: weiter angemeldet.

**Speichern**
4. Notfallkarte ausfüllen, sofort Seite neu laden: Eingabe ist da.
5. Eingabe machen, sofort den Tab schließen, neu öffnen: Eingabe ist da.
6. Eingabe machen, sofort in eine andere App wechseln, zurück: Eingabe ist da.
7. Flugmodus an, Eingabe machen: klare Meldung. Flugmodus aus: lässt sich speichern.
8. Sehr langen Text einfügen: Seite bleibt bedienbar, nichts wird abgeschnitten.
9. Auf zweitem Gerät anmelden: Daten sind dort.

**Vorsorge-Check**
10. Drei Fragen beantworten, neu laden: Stand bleibt. Auf dem zweiten Gerät fortsetzen.

**Darstellung**
11. Hochformat und Querformat: nichts abgeschnitten, kein seitliches Scrollen außer im Feld aus Punkt 8.
12. Tastatur verdeckt kein aktives Eingabefeld, und Speichermeldungen bleiben sichtbar.
13. Menü öffnet und schließt, alle Schaltflächen lassen sich treffen.
14. Größere Systemschrift: lesbar, nichts überlappt.
15. Bildschirmleser (VoiceOver, TalkBack): Felder und Fehlermeldungen werden vorgelesen.

**Inhalte**
16. Wissensseiten zeigen nur den Prüfhinweis, nirgends steht „Geprüft“.
17. PDF oder Druck erzeugen, Datei öffnen: lesbar, Hinweis „kein Testament“ vorhanden.

**Daten**
18. Export herunterladen und öffnen.
19. Testkonto löschen: Anmeldung danach nicht mehr möglich.

## Ergebnis

Bestanden nur, wenn alle Punkte auf allen Geräten erfüllt oder als unkritisch vom Owner bewertet sind. Danach Eintrag `smartphone` in `docs/release/freigaben.json` durch den Owner.
