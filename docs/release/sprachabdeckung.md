# Sprachabdeckung (Stand 03.11.2026)

**Für:** Fachprüfer und Owner. **Keine Übersetzung ist fachlich geprüft.** Eine Übersetzung erzeugt keine Freigabe, auch nicht aus einer geprüften deutschen Fassung; jede Sprache bräuchte eine eigene Prüfung.

Quelle: `src/lib/i18n/translations.ts`. Fehlende Schlüssel fallen auf Deutsch zurück. Die meisten Modultexte stehen fest auf Deutsch im Code und werden in keiner Sprache übersetzt.

| Sprache | Schlüssel | Umfang | Fachliche Aussagen | Prüfstand |
|---|---|---|---|---|
| Deutsch (`de`) | 265 | vollständig | gesperrt, neutrale Texte (`src/lib/content/module-texts.ts`) | nicht geprüft |
| Englisch (`en`) | 261 | fast vollständig | wie Deutsch; gesperrte Stellen haben neutrale englische Fassung | nicht geprüft |
| Türkisch (`tr`) | 57 | nur allgemeine Oberfläche | keine; Werbezeilen und Prüfbadge entfernt | nicht geprüft |
| Arabisch (`ar`) | 57 | nur allgemeine Oberfläche | keine; wie oben | nicht geprüft |
| Bosnisch (`bs`) | 57 | nur allgemeine Oberfläche | keine; wie oben | nicht geprüft |
| Albanisch (`sq`) | 57 | nur allgemeine Oberfläche | keine; wie oben | nicht geprüft |

**Entfernt am 03.11.2026** (Wortlaut im Archiv `gesperrte-modultexte.md`):

- `hero.title`, `hero.subtitle`, `hero.claim` in `tr`, `ar`, `bs`, `sq`: veraltet, unter anderem die Statusaussage „islamisch vorbereitet“ und der Bezug auf Barzakh. Rückfall auf den neutralen deutschen Text.
- `review.badge` in `tr`, `ar`, `bs`, `sq`: behauptete eine laufende religiöse Prüfung, die es nicht gibt. Auch in `de` und `en` neutral: „Noch nicht fachlich geprüft“.

**Verbleibend, keine Fachaussage:** Hinweise wie „ersetzt keinen Imam“ und „keine Garantie“ bleiben übersetzt, weil sie die Grenzen des Produkts benennen. Ihre Richtigkeit in der jeweiligen Sprache ist nicht geprüft.

**Vor einer Freigabe weiterer Sprachen:** muttersprachliche Prüfung, je Sprache eigener Beleg in `src/lib/content/module-texts.ts`.
