# Entscheidungsvorlage: Marke, Domain, Mailanbieter (Stand 03.11.2026)

**Für:** Owner. Nichts davon ist festgelegt; Agenten buchen und kontaktieren nicht. Recherchen sind Vorarbeit, keine Rechtsauskunft.

| Thema | Vorhandener Stand | Fehlt | Nächste Entscheidung |
|---|---|---|---|
| **Marke** | „Amanah“ ist interner Arbeitsname. DE-Wortmarke „Amanah“ für Bestattung und ein gleichnamiger Bestatter gefunden (Doku 33). Oberfläche zeigt derzeit „Mein Wille“; `mein-wille.de` ist fremdbesetzt im selben Thema (Doku 33). Kandidaten in Doku 34, Baqiya zurückgezogen | Anwaltliche Prüfung, Zielgruppentest (Doku 37) | Welche 2 bis 3 Namen gehen an die Markenprüfung? |
| **Domain** | `amanahordner.de` nicht registriert (`NXDOMAIN`), wegen der Marke offen | Entscheidung zur Marke | Erst nach der Marke. Registrierung öffnet nichts: Die Route ist geschlossen (Doku 41) |
| **Mailanbieter** | Anbindung für Brevo und Postmark gebaut. Vergleich und Empfehlung Brevo wegen EU-Hosting in Doku 21, Entscheidung beim Owner. Staging-Alarm-Zugang für Brevo existiert, externer Versand ist per Owner-Entscheidung aus (Doku 30) | Absender-Domain, AVV, SPF/DKIM/DMARC, autorisierte Testadresse | Anbieter wählen, sobald die Domain feststeht; Testadresse nennen |

**Abhängigkeit:** Marke → Domain → Absender → echter Mailtest → Registrierung. Ohne Mail bleibt die Registrierung blockiert (`validate-release`). Der Ablauf steht in [Doku 44](../strategy/44-domain-und-mail-aktivierung.md).
