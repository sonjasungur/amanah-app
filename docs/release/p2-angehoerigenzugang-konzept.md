# Digitaler Notfallzugang für benannte Vertrauenspersonen: Konzept, Bedrohungsanalyse, DSGVO-Prüfung (P2.4)

**Stand:** 18.11.2026.

**Status:** Konzept und isolierter Prototyp. **Nicht live.**
- Der Prototyp `src/lib/access/emergency-access.ts` ist an keine Schnittstelle, Datenbank oder Seite angeschlossen; ein Test sichert das ab.
- Eine Live-Schaltung braucht eine gesonderte Abnahme, eine Datenschutz-Folgenabschätzung und eine Datenbankmigration (Freigabe nötig).

## 1. Ziel und Grenzen

- **Ziel:** Benannte Vertrauenspersonen können im Ernstfall genau die Bereiche sehen, die der Nutzer freigegeben hat, ohne sein Hauptpasswort zu kennen.
- **Nicht vorgesehen:**
  - automatisch aktivierte Zugänge;
  - offene Links;
  - QR-Codes mit lesbaren Daten;
  - Freigabe per E-Mail-Link ohne Konto;
  - Zugriff durch Amanah-Mitarbeitende.

## 2. Rollen und Zustände

| Zustand | Bedeutung | Zugriff |
|---|---|---|
| Entwurf | Nutzer hat Person und Bereiche gewählt | keiner |
| Eingeladen | Nutzer hat ausdrücklich bestätigt; Einladung an das Konto der Person | keiner |
| Aktiv | Person hat mit eigenem, bestätigtem Konto und zweitem Faktor angenommen | nur gewählte Bereiche |
| Widerrufen | jederzeit durch den Nutzer, sofort wirksam | keiner |
| Abgelaufen | optionales Ablaufdatum erreicht | keiner |

**Freigabearten:**
- **„Sofort“:** Die Person sieht die Bereiche ab Annahme, z. B. die Notfallkarte für den Ehepartner.
- **„Nach Notfallanfrage“:** Die Person stellt eine Anfrage. Danach läuft eine **Wartezeit (mindestens 24 Stunden)**, in der der Nutzer per App oder E-Mail benachrichtigt wird und **widersprechen** kann. Erst danach öffnet sich der Zugang. Das entspricht dem öffentlich beschriebenen Muster von Everplans („Unlocker“ mit Widerspruchsfrist); siehe P1-Crosscheck.

**Bereiche** werden einzeln freigegeben:
- Notfallkarte;
- Wo Dokumente liegen;
- Janazah-Wünsche;
- Familie & Kontakte;
- Gesundheitsangaben, Vermögensübersicht, Schulden & Amanah: Diese **sensiblen** Bereiche brauchen eine eigene Bestätigung.

**Für den Nutzer jederzeit sichtbar** ist eine Liste „Wer kann was sehen?“ mit Klartext pro Freigabe (`describeGrant`), dem Zugriffsprotokoll und einem Widerruf-Knopf.

## 3. Architektur (Vorschlag)

**Speicherung.** Freigaben, Notfallanfragen und das Zugriffsprotokoll stehen in **eigenen Tabellen**, getrennt vom Vorsorgeordner. Das braucht eine **Migration (Freigabe nötig)**.

**Datenauslieferung.** Der Ordner bleibt wie heute mit Umschlagverschlüsselung gespeichert (AES-256-GCM, Datenschlüssel je Datensatz, Schlüssel-Schlüssel aus der Umgebung, AAD an den Eigentümer gebunden). Für eine freigegebene Person erzeugt der Server **nur die freigegebenen Abschnitte** als Ausschnitt und liefert sie aus, nach der Prüfung `canAccess` und mit Protokolleintrag (`accessWithLog`). Die Person erhält nie den ganzen Ordner und nie Schlüssel.

**Alternative für später.** Freigabe-Ausschnitte mit eigenem Datenschlüssel, gebunden an das Konto der Person (AAD = Freigabe-ID und Konto-ID). Das bringt bessere Trennung, aber mehr Aufwand und Schlüsselverwaltung.

**Authentifizierung der Person.**
- eigenes Amanah-Konto mit bestätigter E-Mail-Adresse;
- **zweiter Faktor (TOTP)** verpflichtend für Freigabe-Zugriffe; den gibt es heute noch nicht, das ist ein eigener Baustein;
- Sitzung wie heute (HttpOnly-Cookie, Same-Origin-Prüfung).

**Notfallanfrage.** Bei einer Anfrage wird der Nutzer über alle hinterlegten Wege benachrichtigt. Ein Widerspruch beendet die Anfrage. Wiederholte Anfragen werden gebremst; die bestehende Begrenzungstabelle wird erweitert.

**Löschung.**
- Widerruf und Kontolöschung des Nutzers löschen alle Freigaben sofort.
- Das Zugriffsprotokoll bleibt **ohne Inhalte** für eine festzulegende Frist erhalten (Vorschlag: 12 Monate) und wird dann gelöscht.
- Löscht die freigegebene Person ihr Konto, erlöschen ihre Freigaben.

## 4. Bedrohungsanalyse (STRIDE, verkürzt)

| Bedrohung | Beispiel | Gegenmaßnahme |
|---|---|---|
| Identitätsvortäuschung | Jemand gibt sich als Vertrauensperson aus | Annahme nur mit eigenem Konto, bestätigter E-Mail und zweitem Faktor; Einladung bindet an genau dieses Konto |
| Missbrauch durch echte Vertrauensperson | Anfrage zu Lebzeiten, um Vermögen einzusehen | „Nach Notfallanfrage“ mit Wartezeit und Widerspruch; sensible Bereiche einzeln bestätigt; Protokoll für den Nutzer sichtbar |
| Manipulation | Person ändert Daten | Freigaben sind **nur lesend**; keine Schreibrechte |
| Abstreiten | „Ich habe nichts angesehen“ | Zugriffsprotokoll je Abruf (wer, Bereich, Zeit, erlaubt/abgelehnt), unveränderlich angehängt |
| Informationsabfluss | Weitergabe von Links, Screenshots | Keine Links ohne Anmeldung, keine QR-Codes; Ausschnitt nur der freigegebenen Bereiche; Screenshots lassen sich nicht verhindern (Restrisiko, im UI benannt) |
| Dienstverweigerung | Massenhafte Anfragen | Ratenbegrenzung je Konto und Freigabe |
| Rechteausweitung | Fehler in der Prüfung | Eine einzige Prüffunktion `canAccess` für jeden Lesezugriff, durch Tests abgedeckt; Serverprüfung, nie Client |
| Konto- oder Geräteverlust des Nutzers | Nutzer kommt nicht mehr an sein Konto | Bestehende Passwortrücksetzung; Freigaben bleiben bestehen; Widerspruch auch nach Rücksetzung möglich |
| Konto- oder Geräteverlust der Person | Zweiter Faktor verloren | Neuer Faktor nur nach erneuter Einladung durch den Nutzer (keine Selbstwiederherstellung) |

## 5. DSGVO-Prüfung (Vorprüfung, keine Rechtsberatung)

| Punkt | Bewertung | Offene Aufgabe |
|---|---|---|
| Rechtsgrundlage | Einwilligung des Nutzers (Art. 6 Abs. 1 lit. a), für Gesundheitsdaten ausdrückliche Einwilligung (Art. 9 Abs. 2 lit. a) je Freigabe | Einwilligungstexte juristisch prüfen lassen |
| Daten der Vertrauensperson | Name, Konto, Protokoll: Vertragserfüllung bzw. berechtigtes Interesse | Information der Person bei Einladung (Art. 13/14) |
| Zweckbindung | Nur Lesen der freigegebenen Bereiche im Notfall | Keine Auswertung des Protokolls zu anderen Zwecken |
| Datenminimierung | Bereichsweise Ausschnitte statt ganzer Ordner | – |
| Speicherbegrenzung | Freigaben bis Widerruf/Ablauf; Protokoll befristet | Frist festlegen |
| Rechte der Betroffenen | Auskunft und Löschung der Freigaben im Export und bei Kontolöschung | Export um Freigaben und Protokoll erweitern |
| Datenschutz-Folgenabschätzung | **Erforderlich** (Gesundheitsdaten, neue Zugriffsform) | DSFA vor Live-Schaltung |
| Tod des Nutzers | DSGVO gilt nicht für Verstorbene; Zugang folgt dem Willen des Nutzers. Erbrechtliche Fragen (BGH III ZR 183/17 zu Nutzerkonten) | Juristisch prüfen, wie das Verhältnis zu Erben dargestellt wird |

## 6. Prototyp: was geprüft ist

Tests in `src/__tests__/p2-emergency-access.test.ts`:
- **Nie automatisch aktiv:** Ablauf Entwurf → Einladung (nur nach Bestätigung) → Annahme nur mit bestätigter E-Mail und zweitem Faktor; nicht durch den Eigentümer selbst.
- **Bereiche getrennt:** Gesundheitsangaben bleiben zu, bis sie eigens bestätigt sind; fremde Konten haben keinen Zugriff.
- **Widerruf und Ablauf** beenden den Zugriff sofort.
- **Notfallanfrage:** Sie öffnet frühestens nach 24 Stunden; ein Widerspruch stoppt sie.
- **Protokoll:** Jeder Versuch wird protokolliert, ohne Inhalte.
- **Klartext-Beschreibung** des Zustands.
- **Isolation:** Kein anderer Teil der App nutzt das Modul, und es enthält keine Links, Token oder QR-Codes.

## 7. Für eine Live-Schaltung nötig (jeweils Owner-Freigabe)

1. DSFA und juristische Prüfung der Einwilligungs- und Informationstexte.
2. Zweiter Faktor (TOTP) für Konten.
3. Datenbankmigration für Freigaben, Anfragen und Protokoll.
4. Serverseitige Ausschnitt-Auslieferung mit `canAccess` und Protokoll; Benachrichtigung bei Anfragen. E-Mail-Versand ist ein Kostenthema und braucht eine eigene Freigabe.
5. Oberfläche „Wer kann was sehen?“ und Ansicht für die Vertrauensperson.
6. Sicherheitsprüfung (Penetrationstest) vor öffentlichem Betrieb.
