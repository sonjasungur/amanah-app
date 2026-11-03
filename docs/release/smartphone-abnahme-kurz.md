# Smartphone-Abnahme: Kurzablauf (Stand 03.11.2026)

**Für:** Owner oder beauftragte Testperson. Dauer rund 20 Minuten je Gerät. Vollständige Liste: Doku 43. **Echte Geräte: `NOT_RUN`.** Bestanden sind bisher nur Emulationen.

**Kandidat:** `b473cd5` auf Staging.

**Testlink:** `https://<host>`, liegt erst nach der Einrichtung vor (Doku 45 §4.1).

**Passwortabfrage des Browsers:** Benutzer und Passwort abrufen mit `ssh gemeinsam1-prod cat /opt/amanah-staging/state/https-access`. Nicht per Chat oder Mail weitergeben.

**Nur erfundene Daten eintragen**, keine echten Namen, keine echten Dokumente. Es wird keine Mail verschickt; die Bestätigung steht in der Test-Outbox.

## Ablauf, auf iPhone (Safari) und Android (Chrome) je einmal

| # | Schritt | Erwartet | iPhone | Android |
|---|---|---|---|---|
| 1 | Link öffnen, Passwortabfrage ausfüllen | Startseite erscheint | `NOT_RUN` | `NOT_RUN` |
| 2 | Registrieren mit `test-<name>@staging.invalid` und eigenem Testpasswort | Hinweis „E-Mail prüfen“ | `NOT_RUN` | `NOT_RUN` |
| 3 | Neuen Tab: `https://<host>/api/dev/outbox?to=test-<name>@staging.invalid`, den Link aus der Antwort kopieren und öffnen | Adresse bestätigt, Anmeldung möglich | `NOT_RUN` | `NOT_RUN` |
| 4 | Abmelden, wieder anmelden; falsches Passwort probieren | Fehlermeldung, dann Dashboard | `NOT_RUN` | `NOT_RUN` |
| 5 | Notfallkarte ausfüllen, Seite sofort neu laden | Eingabe ist da | `NOT_RUN` | `NOT_RUN` |
| 6 | Eingabe ändern, Tab schließen, neu öffnen | Eingabe ist da | `NOT_RUN` | `NOT_RUN` |
| 7 | Beim Tippen: Tastatur verdeckt das Feld nicht, Menü öffnet und schließt | bedienbar | `NOT_RUN` | `NOT_RUN` |
| 8 | Dokumente: Eintrag anlegen, neu laden | Eintrag ist da | `NOT_RUN` | `NOT_RUN` |
| 9 | PDF oder Druck erzeugen und öffnen | lesbar, Hinweis „kein Testament“ | `NOT_RUN` | `NOT_RUN` |
| 10 | Einstellungen: Export herunterladen und öffnen | eigene Testdaten enthalten | `NOT_RUN` | `NOT_RUN` |
| 11 | Wissensseite öffnen | nur Prüfhinweis, nirgends „Geprüft“ | `NOT_RUN` | `NOT_RUN` |
| 12 | Einstellungen: Konto löschen, Passwort eingeben | Konto weg, Abmeldung | `NOT_RUN` | `NOT_RUN` |
| 13 | Mit dem gelöschten Konto anmelden | nicht möglich | `NOT_RUN` | `NOT_RUN` |

**Eintragen:** `bestanden` oder `Fehler` mit Gerät, System, Browser, Datum und Screenshot. Nur tatsächlich Durchgeführtes gilt als bestanden.

**Bei Fehlern:** Nichts Echtes eingeben, Screenshot behalten, weitermachen.
