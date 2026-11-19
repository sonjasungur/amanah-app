# Prüfpakete für die externen Freigaben (Stand 03.11.2026)

**Für:** den Owner, der die Prüfer auswählt und beauftragt. Es wurde niemand kontaktiert, und keine Freigabe ist erteilt. Agenten tragen keine Freigaben ein und treten nicht als Prüfer auf.

| Paket | Freigabe in `freigaben.json` | Blockiert |
|---|---|---|
| [Datenschutz](datenschutz.md) | `datenschutz` | jede öffentliche Freischaltung, Konto mit echten Daten, Verlauf, Löschprotokoll |
| [Recht](recht.md) | `recht` | jede öffentliche Freischaltung, Modultexte, Testament-Funktionen |
| [Religion](religion.md) | `religion` | Wissensartikel, Hadith und Qur'an, religiöse Modultexte, Erbquoten |
| [Medizin](medizin.md) | `medizin` | Inhalte zur Patientenverfügung |
| [Nutzungsrechte](nutzungsrechte.md) | `nutzungsrechte` | Qur'an-Übersetzung, Hadith-Wiedergaben |

**Smartphone** ist kein Fachpaket, sondern ein technischer Nachweis: [Doku 43](../../strategy/43-smartphone-abnahme.md).

**Was ein bestandenes Paket bewirkt:** Der Owner trägt Prüfer, Datum und Dokument ein. Erst danach lässt sich der jeweilige Inhalt freischalten: `src/lib/content/module-texts.ts` (`released`), Wissenseinträge (`reviewEvidence`), Katalogartikel (Prüfungen je Version).

**Was das für den Umfang bedeutet:** `validate-release --mode=public-release` verlangt alle sechs Freigaben, auch wenn ein Inhalt gesperrt bleibt. Ein kleinerer erster Umfang ohne Wissensartikel, zum Beispiel, wäre möglich: Das Paket `religion` könnte sich dann auf die sichtbaren Begriffe beschränken. Das ist deine Entscheidung und würde nur den Prüfumfang ändern, nicht die Regel. Sperren werden nicht entfernt, um den Check grün zu bekommen.
